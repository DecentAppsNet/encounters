import { assertNonNullable } from "decent-portal";

import { NARRATION_PREFIX, PLAYER_PREFIX } from "@/components/chat/ChatHistory";
import TextConsoleBuffer from "@/components/textConsole/TextConsoleBuffer";
import { isServingLocally } from "@/developer/devEnvUtil";
import { enableConditionalCharacterTriggers, findCharacterTriggerInText, stripTriggerCodes } from "@/encounters/encounterUtil";
import Encounter from "@/encounters/types/Encounter";
import Action, { MessageAction } from "@/encounters/v0/types/Action";
import ActionType from "@/encounters/v0/types/ActionType";
import { addAssistantMessage, addUserMessage, clearChatHistory, generate, isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
import { executeCode } from "@/spielCode/codeUtil";
import VariableManager, { VariableCollection } from "@/spielCode/VariableManager";

// TODO - at some point, refactor the encounter-specific logic into encounterUtil or a different module that is uncoupled to input, display, and LLM.

export const GENERATING = '...';
const MAX_LINE_COUNT = 100;

let theChatBuffer:TextConsoleBuffer|null = null;
let theEncounter:Encounter|null = null;
let theSessionVariables:VariableManager|null = null;

function _isLastLineGenerating():boolean {
  assertNonNullable(theChatBuffer);
  if (!theChatBuffer.lines.length) return false;
  const lastLine = theChatBuffer.lines[theChatBuffer.lines.length - 1].text;
  return lastLine.endsWith(GENERATING);
}

function _addChatBufferLine(line:string) {
  assertNonNullable(theChatBuffer);
  if (_isLastLineGenerating()){
    theChatBuffer.replaceLastLine(line);
  } else {
    theChatBuffer.addLine(line);
  }
}

function _addPlayerLine(line:string) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(`${PLAYER_PREFIX}${line}`);
}

function _addCharacterLine(line:string) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(line);
}

function _addNarrationLine(line:string) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(`${NARRATION_PREFIX}${line}`);
}

function _addGeneratingLine() {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(GENERATING);
}

function _onUpdateResponse(responseText:string, setLines:Function) {
  assertNonNullable(theChatBuffer);
  const displayText = stripTriggerCodes(responseText);
  _addChatBufferLine(`${displayText}${GENERATING}`);
  setLines(theChatBuffer.lines)
}

function _actionCriteriaMet(action:MessageAction):boolean {
  if (!action.criteria) return true;
  assertNonNullable(theSessionVariables); 
  executeCode(action.criteria, theSessionVariables);
  return theSessionVariables.get('__result') === true;
}

function _handleActions(actions:Action[]):string { // TODO factor out of this module. See comments at top.
  assertNonNullable(theChatBuffer);
  let systemMessage = '';
  for(let i = 0; i < actions.length; ++i) {
    const action = actions[i];
    switch(action.actionType) {
      case ActionType.NARRATION_MESSAGE:
        if (_actionCriteriaMet(action)) _addNarrationLine(action.message);
      break;

      case ActionType.CHARACTER_MESSAGE:
        if (!_actionCriteriaMet(action)) break; 
        _addCharacterLine(action.message);
        addAssistantMessage(action.message);
      break;

      case ActionType.PLAYER_MESSAGE:
        if (!_actionCriteriaMet(action)) break; 
        _addPlayerLine(action.message);
        addUserMessage(action.message);
      break;
      
      case ActionType.INSTRUCTION_MESSAGE:
        if (_actionCriteriaMet(action)) {
          if (systemMessage.length) systemMessage += '\n';
          systemMessage += action.message;
        }
      break;

      case ActionType.CODE:
        assertNonNullable(theSessionVariables);
        executeCode(action.code, theSessionVariables);
      break;

      default:
        throw Error('Unexpected');
    }
  }
  return systemMessage;
}

function _finalizeResponse(responseText:string) {
  assertNonNullable(theChatBuffer);
  assertNonNullable(theEncounter);
  const characterTrigger = findCharacterTriggerInText(responseText, theEncounter.characterTriggers);
  if (characterTrigger) {
    characterTrigger.isEnabled = false; // Prevent the same trigger from firing again in the future, unless it's re-enabled by the encounter's logic.
    _handleActions(characterTrigger.actions);
  } else {
    const displayText = stripTriggerCodes(responseText);
    _addCharacterLine(displayText);
  }
}

function _encounterToSystemMessage(encounter:Encounter):string { // TODO factor out of this module. See comments at top.
  assertNonNullable(theEncounter);
  assertNonNullable(theSessionVariables);
  enableConditionalCharacterTriggers(theEncounter.characterTriggers, theSessionVariables);
  let systemMessage = _handleActions(encounter.instructionActions);
  for(let i = 0; i < encounter.characterTriggers.length; ++i) {
    const { criteria, triggerCode, isEnabled } = encounter.characterTriggers[i];
    if (!isEnabled) continue;
    systemMessage += `\nIf ${criteria} then output @${triggerCode} and nothing else.`;
  }
  return systemMessage;
}

function _initForEncounter(encounter:Encounter) {
  assertNonNullable(theChatBuffer);
  theChatBuffer.clear();
  theEncounter = encounter;
  theSessionVariables = new VariableManager();
  const systemMessage = _encounterToSystemMessage(encounter);
  setSystemMessage(systemMessage);
  clearChatHistory();
  _handleActions(encounter.startActions);
}

function _updateSystemMessageForEncounter() {
  assertNonNullable(theEncounter);
  assertNonNullable(theSessionVariables);
  const systemMessage = _encounterToSystemMessage(theEncounter);
  setSystemMessage(systemMessage);
}

export function initChat(encounter:Encounter, setLines:Function) {
  theChatBuffer = new TextConsoleBuffer(MAX_LINE_COUNT);
  _initForEncounter(encounter);
  setLines(theChatBuffer.lines);
}

export function getVariables():VariableCollection {
  return !theSessionVariables ? {} : theSessionVariables.toCollection();
}

export function updateEncounter(encounter:Encounter, setEncounter:Function, setModalDialogName:Function, setLines:Function) {
  assertNonNullable(theChatBuffer);
  setModalDialogName(null);
  setEncounter(encounter);
  _initForEncounter(encounter);
  setLines(theChatBuffer.lines);
}

export function restartEncounter(encounter:Encounter, setLines:Function) {
  assertNonNullable(theChatBuffer);
  _initForEncounter(encounter);
  setLines(theChatBuffer.lines);
}

export async function submitPrompt(prompt:string, setLines:Function) { // TODO factor out of this module. See comments at top.
    assertNonNullable(theChatBuffer);
    _addPlayerLine(prompt);
    _addGeneratingLine();
    setLines(theChatBuffer.lines);
    _updateSystemMessageForEncounter();
    try {
      if (!isLlmConnected()) { 
        const message = isServingLocally() 
        ? `LLM is not connected. You're in a dev environment where this is expected (hot reloads, canceling the LLM load). You can refresh the page to load the LLM.`
        : 'LLM is not connected. Try refreshing the page.';
        console.error(message); // TODO toast
        return; 
      }
      const fullResponseText = await generate(prompt, (responseText:string) => _onUpdateResponse(responseText, setLines) );
      _finalizeResponse(fullResponseText);
      setLines(theChatBuffer.lines);
    } catch(e) {
      console.error('Error while generating response.', e);
    }
}
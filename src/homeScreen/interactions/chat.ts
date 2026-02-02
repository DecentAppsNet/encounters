import { NARRATIVE_PREFIX, USER_PREFIX } from "@/components/chat/ChatHistory";
import TextConsoleBuffer from "@/components/textConsole/TextConsoleBuffer";
import { isServingLocally } from "@/developer/devEnvUtil";
import { findCharacterTriggerInText, stripTriggerCodes } from "@/encounters/encounterUtil";
import Encounter from "@/encounters/types/Encounter";
import Action, { MessageAction } from "@/encounters/v0/types/Action";
import ActionType from "@/encounters/v0/types/ActionType";
import { clearChatHistory, generate, isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
import { executeCode } from "@/spielCode/codeUtil";
import VariableManager from "@/spielCode/VariableManager";
import { assertNonNullable } from "decent-portal";

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

function _addUserLine(line:string) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(`${USER_PREFIX}${line}`);
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
  return theSessionVariables.get('result') === true;
}

function _handleActions(actions:Action[]):string {
  assertNonNullable(theChatBuffer);
  let systemMessage = '';
  for(let i = 0; i < actions.length; ++i) {
    const action = actions[i];
    switch(action.actionType) {
      case ActionType.DISPLAY_MESSAGE:
        if (_actionCriteriaMet(action)) _addChatBufferLine(`${NARRATIVE_PREFIX}${action.message}`);
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
    _handleActions(characterTrigger.actions);
  } else {
    const displayText = stripTriggerCodes(responseText);
    _addChatBufferLine(displayText);
  }
}

function _encounterToSystemMessage(encounter:Encounter):string {
  let systemMessage = _handleActions(encounter.instructionActions);
  for(let i = 0; i < encounter.characterTriggers.length; ++i) {
    const { criteria, triggerCode } = encounter.characterTriggers[i];
    systemMessage += `\nIf ${criteria} then output @${triggerCode} and nothing else.`;
  }
  return systemMessage;
}

function _initForEncounter(encounter:Encounter) {
  assertNonNullable(theChatBuffer);
  theChatBuffer.clear();
  theEncounter = encounter;
  theSessionVariables = new VariableManager();
  theSessionVariables.set('encounterTitle', encounter.title); // TODO - delete this later. Just getting past a compile error.
  const systemMessage = _encounterToSystemMessage(encounter);
  setSystemMessage(systemMessage);
  clearChatHistory();
  _handleActions(encounter.startActions);
}

export function initChat(encounter:Encounter, setLines:Function) {
  theChatBuffer = new TextConsoleBuffer(MAX_LINE_COUNT);
  _initForEncounter(encounter);
  setLines(theChatBuffer.lines);
}

export function updateEncounter(encounter:Encounter, setEncounter:Function, setModalDialogName:Function, setLines:Function) {
  assertNonNullable(theChatBuffer);
  setModalDialogName(null);
  setEncounter(encounter);
  _initForEncounter(encounter);
  setLines(theChatBuffer.lines);
}

export async function submitPrompt(prompt:string, setLines:Function) {
    assertNonNullable(theChatBuffer);
    _addUserLine(prompt);
    _addGeneratingLine();
    setLines(theChatBuffer.lines);
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
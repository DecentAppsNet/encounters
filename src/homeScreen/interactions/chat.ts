import { NARRATIVE_PREFIX, USER_PREFIX } from "@/components/chat/ChatHistory";
import TextConsoleBuffer from "@/components/textConsole/TextConsoleBuffer";
import { isServingLocally } from "@/developer/devEnvUtil";
import { findOutcomeInText, stripOutcomeCodes } from "@/encounters/encounterUtil";
import Encounter from "@/encounters/types/Encounter";
import { clearChatHistory, generate, isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
import { assertNonNullable } from "decent-portal";

export const GENERATING = '...';
const MAX_LINE_COUNT = 100;

let theChatBuffer:TextConsoleBuffer|null = null;
let theOutcomes:Record<string,string> = {};

function _addUserLine(line:string, setLines:Function) {
  if (!theChatBuffer) throw Error('Unexpected');
  theChatBuffer.addLine(`${USER_PREFIX}${line}`);
  setLines(theChatBuffer.lines);
}

function _addGeneratingLine(setLines:Function) {
  if (!theChatBuffer) throw Error('Unexpected');
  theChatBuffer.addLine(GENERATING);
  setLines(theChatBuffer.lines);
}

function _addNarrationLine(line:string, setLines:Function) {
  if (!theChatBuffer) throw Error('Unexpected');
  theChatBuffer.addLine(`${NARRATIVE_PREFIX}${line}`);
  setLines(theChatBuffer.lines);
}

function _onUpdateResponse(responseText:string, setLines:Function) {
  if (!theChatBuffer) throw Error('Unexpected');
  const displayText = stripOutcomeCodes(responseText);
  theChatBuffer.replaceLastLine(`${displayText}${GENERATING}`);
  setLines(theChatBuffer.lines);
}

function _finalizeResponse(responseText:string, setLines:Function) {
  if (!theChatBuffer) throw Error('Unexpected');
  const outcomeText = findOutcomeInText(responseText, theOutcomes);
  if (outcomeText) {
    theChatBuffer.replaceLastLine(`${NARRATIVE_PREFIX}${outcomeText}`);
  } else {
    const displayText = stripOutcomeCodes(responseText);
    theChatBuffer.replaceLastLine(displayText);
  }
  setLines(theChatBuffer.lines);
}

function _initForEncounter(encounter:Encounter, setLines:Function) {
  assertNonNullable(theChatBuffer);
  theChatBuffer.clear();
  theOutcomes = { ...encounter.outcomes };
  setSystemMessage(encounter.systemMessage);
  clearChatHistory();
  _addNarrationLine(encounter.preamble, setLines);
}

export function initChat(encounter:Encounter, setLines:Function) {
  theChatBuffer = new TextConsoleBuffer(MAX_LINE_COUNT);
  _initForEncounter(encounter, setLines);
}

export function updateEncounter(encounter:Encounter, setEncounter:Function, setModalDialogName:Function, setLines:Function) {
  setModalDialogName(null);
  setEncounter(encounter);
  _initForEncounter(encounter, setLines);
}

export async function submitPrompt(prompt:string, setLines:Function) {
    _addUserLine(prompt, setLines);
    _addGeneratingLine(setLines);
    try {
      if (!isLlmConnected()) { 
        const message = isServingLocally() 
        ? `LLM is not connected. You're in a dev environment where this is expected (hot reloads, canceling the LLM load). You can refresh the page to load the LLM.`
        : 'LLM is not connected. Try refreshing the page.';
        console.error(message); // TODO toast
        return; 
      }
      const fullResponseText = await generate(prompt, (responseText:string) => _onUpdateResponse(responseText, setLines));
      _finalizeResponse(fullResponseText, setLines);
    } catch(e) {
      console.error('Error while generating response.', e);
    }
}
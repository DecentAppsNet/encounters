import { assertNonNullable } from "decent-portal";

import { NARRATION_PREFIX, PLAYER_PREFIX } from "@/components/chat/ChatHistory";
import TextConsoleBuffer from "@/components/textConsole/TextConsoleBuffer";
import { isServingLocally } from "@/developer/devEnvUtil";
import Encounter from "@/encounters/types/Encounter";
import EncounterSession from "@/encounters/EncounterSession";
import LLMMessages from "@/llm/types/LLMMessages";
import { stripTriggerCodes } from "@/encounters/encounterUtil";
import { generate, isLlmConnected } from "@/llm/llmUtil";
import { VariableCollection } from "@/spielCode/VariableManager";

export const GENERATING = '...';
const MAX_LINE_COUNT = 100;

let theChatBuffer:TextConsoleBuffer|null = null;
let theSession:EncounterSession|null = null;

function _isLastLineGenerating():boolean {
  assertNonNullable(theChatBuffer);
  if (!theChatBuffer.lines.length) return false;
  const lastLine = theChatBuffer.lines[theChatBuffer.lines.length - 1].text;
  return lastLine.endsWith(GENERATING);
}

function _addChatBufferLine(line:string, setLines:Function) {
  assertNonNullable(theChatBuffer);
  if (_isLastLineGenerating()){
    theChatBuffer.replaceLastLine(line);
  } else {
    theChatBuffer.addLine(line);
  }
  setLines(theChatBuffer.lines);
}

function _addPlayerLine(line:string, setLines:Function) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(`${PLAYER_PREFIX}${line}`, setLines);
}

function _addCharacterLine(line:string, setLines:Function) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(line, setLines);
}

function _addNarrationLine(line:string, setLines:Function) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(`${NARRATION_PREFIX}${line}`, setLines);
}

function _addGeneratingLine(setLines:Function) {
  assertNonNullable(theChatBuffer);
  _addChatBufferLine(GENERATING, setLines);
}

function _onUpdateResponse(responseText:string, setLines:Function) {
  assertNonNullable(theChatBuffer);
  const displayText = stripTriggerCodes(responseText);
  _addChatBufferLine(`${displayText}${GENERATING}`, setLines);
}

function _initForEncounter(encounter:Encounter) {
  assertNonNullable(theChatBuffer);
  assertNonNullable(theSession);
  theChatBuffer.clear();
  theSession.start(encounter);
}

async function _onGenerate(messages:LLMMessages, setLines:Function):Promise<string> {
  _addGeneratingLine(setLines);
  const response = await generate(messages, partialResponse => _onUpdateResponse(partialResponse, setLines));
  return response;
}

export function initChat(encounter:Encounter, setLines:Function) {
  theChatBuffer = new TextConsoleBuffer(MAX_LINE_COUNT);
  theSession = new EncounterSession(MAX_LINE_COUNT);
  theSession.bindFunction((m:LLMMessages) => _onGenerate(m, setLines), 'onGenerate');
  theSession.bindFunction((t:string) => _addCharacterLine(t, setLines), 'onCharacterMessage');
  theSession.bindFunction((t:string) => _addNarrationLine(t, setLines), 'onNarrationMessage');
  theSession.bindFunction((t:string) => _addPlayerLine(t, setLines), 'onPlayerMessage');
  _initForEncounter(encounter);
}

export function getVariables():VariableCollection {
  return theSession?.getVariables() ?? {};
}

export function getSystemMessage():string {
  return theSession?.getSystemMessage() ?? 'undefined';
}

export function updateEncounter(encounter:Encounter, setEncounter:Function, setModalDialogName:Function) {
  assertNonNullable(theChatBuffer);
  setModalDialogName(null);
  setEncounter(encounter);
  _initForEncounter(encounter);
}

export function restartEncounter(encounter:Encounter) {
  assertNonNullable(theChatBuffer);
  _initForEncounter(encounter);
}

export async function submitPrompt(prompt:string) {
  if (!isLlmConnected()) { 
    const message = isServingLocally() 
    ? `LLM is not connected. You're in a dev environment where this is expected (hot reloads, canceling the LLM load). You can refresh the page to load the LLM.`
    : 'LLM is not connected. Try refreshing the page.';
    console.error(message); // TODO toast
    return; 
  }

  assertNonNullable(theSession);
  await theSession.prompt(prompt);
}
/*
  This module is an abstraction layer for LLM APIs.

  General Usage:
  * call connect() to initialize the connection.
  * call generate() to get a response for a prompt.
  * other APIs are there for setting system message, chat history, etc.
  
  There is just one connection type for now: WebLLM, but this is abstracted for future CDA updates that may add other LLM providers.
*/

import { updateModelDeviceLoadHistory, updateModelDevicePerformanceHistory } from "decent-portal";

import LLMConnection from "./types/LLMConnection";
import LLMConnectionState from "./types/LLMConnectionState";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { webLlmConnect, webLlmGenerate } from "./webLlmUtil";
import { addAssistantMessageToChatHistory, addUserMessageToChatHistory } from "./messageUtil";

const UNSPECIFIED_MODEL_ID = 'UNSPECIFIED';

let theConnection:LLMConnection = {
  modelId: UNSPECIFIED_MODEL_ID,
  state: LLMConnectionState.UNINITIALIZED,
  webLLMEngine: null,
  serverUrl: null,
  connectionType: LLMConnectionType.NONE
}

let theMessages:LLMMessages = {
  chatHistory: [],
  maxChatHistorySize: 100,
  systemMessage: null
};

let savedMessages:LLMMessages|null = null;

function _clearConnectionAndThrow(message:string) {
  theConnection.webLLMEngine = null;
  theConnection.serverUrl = null;
  theConnection.connectionType = LLMConnectionType.NONE;
  theConnection.state = LLMConnectionState.INIT_FAILED;
  throw new Error(message);
}

function _inputCharCount(prompt:string):number {
  return prompt.length + 
    (theMessages.systemMessage ? theMessages.systemMessage.length : 0) + 
    theMessages.chatHistory.reduce((acc, curr) => acc + curr.content.length, 0);
}

/*
  Public APIs
*/

export function isLlmConnected():boolean {
  return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING;
}

// Useful for app code that needs to use model-specific prompts or has other model-specific behavior.
export function getConnectionModelId():string {
  if (theConnection.modelId = UNSPECIFIED_MODEL_ID) throw Error('Must connect before model ID can be known.');
  return theConnection.modelId;
}

export async function connect(modelId:string, onStatusUpdate:StatusUpdateCallback) {
  if (isLlmConnected()) return;
  theConnection.state = LLMConnectionState.INITIALIZING;
  theConnection.modelId = modelId;
  const startLoadTime = Date.now();
  if (!await webLlmConnect(theConnection.modelId, theConnection, onStatusUpdate)) {
    updateModelDeviceLoadHistory(theConnection.modelId, false);
    _clearConnectionAndThrow('Failed to connect to WebLLM.');
  }
  updateModelDeviceLoadHistory(theConnection.modelId, true, Date.now() - startLoadTime);
  theConnection.state = LLMConnectionState.READY;
}

export function setSystemMessage(message:string|null) {
  theMessages.systemMessage = message;
}

export function getSystemMessage():string|null {
  return theMessages.systemMessage;
}

export function setChatHistorySize(size:number) {
  theMessages.maxChatHistorySize = size;
}

export function saveChatConfiguration() {
  savedMessages = {...theMessages};
}

export function restoreChatConfiguration() {
  if (!savedMessages) throw Error('No saved configuration.');
  theMessages = {...savedMessages};
}

export function clearChatHistory() {
  theMessages.chatHistory = [];
}

export function addAssistantMessage(message:string) {
  addAssistantMessageToChatHistory(theMessages, message);
}

export function addUserMessage(message:string) {
  addUserMessageToChatHistory(theMessages, message);
}

export async function generate(prompt:string, onStatusUpdate:StatusUpdateCallback):Promise<string> {
  let firstResponseTime = 0;
  function _captureFirstResponse(status:string, percentComplete:number) {
    if (!firstResponseTime) firstResponseTime = Date.now();
    onStatusUpdate(status, percentComplete);
  }

  if (!isLlmConnected()) throw Error('LLM connection is not initialized.');
  if (theConnection.state !== LLMConnectionState.READY) throw Error('LLM is not in ready state.');
  theConnection.state = LLMConnectionState.GENERATING;
  let message = '';
  let requestTime = Date.now();
  switch(theConnection.connectionType) {
    case LLMConnectionType.WEBLLM: message = await webLlmGenerate(theConnection, theMessages, prompt, _captureFirstResponse); break;
    default: throw Error('Unexpected');
  }
  updateModelDevicePerformanceHistory(theConnection.modelId, requestTime, firstResponseTime, Date.now(), _inputCharCount(prompt), message.length);
  theConnection.state = LLMConnectionState.READY;
  return message;
}
import LLMMessages from "@/llm/types/LLMMessages";
import Encounter, { LATEST_MAJOR_VERSION } from "./types/Encounter";
import VariableManager, { VariableCollection } from "@/spielCode/VariableManager";
import { majorVersion, parseVersion } from "./versionUtil";
import { textToEncounter } from "./v0/readerUtil";
import Action from "./v0/types/Action";
import { assert, assertNonNullable } from "decent-portal";
import ActionType from "./v0/types/ActionType";
import Code from "@/spielCode/types/Code";
import { executeCode } from "@/spielCode/codeUtil";
import { addAssistantMessageToChatHistory, addToolMessageToChatHistory, addUserMessageToChatHistory } from "@/llm/messageUtil";
import CharacterTrigger from "./v0/types/CharacterTrigger";
import { stripTriggerCodes } from "./encounterUtil";
import { baseUrl } from "@/common/urlUtil";
import FunctionBinding from "@/spielCode/types/FunctionBinding";

type GenerateCallback = (messages:LLMMessages) => Promise<string>;
type MessageCallback = (text:string) => void;

function _textToEncounter(text:string):Encounter {
  const version = parseVersion(text);
  const majorVersionNo = majorVersion(version); // For now, only v0 is supported.
  if (majorVersionNo !== LATEST_MAJOR_VERSION) throw Error(`Unsupported encounter version: ${version}`);
  return textToEncounter(text);
}

function _criteriaMet(criteria:Code|null, variables:VariableManager, functionBindings:FunctionBinding[]):boolean {
  if (!criteria) return true;
  const prevResult = variables.get('__result');
  assertNonNullable(variables); 
  executeCode(criteria, variables, functionBindings);
  const result = variables.get('__result') === true;
  variables.set('__result', prevResult); // Restoring the value avoids any variable name collisions.
  return result;
}

function _enableConditionalCharacterTriggers(characterTriggers:CharacterTrigger[], variables:VariableManager, functionBindings:FunctionBinding[]) {
  for(let i = 0; i < characterTriggers.length; ++i) {
    const trigger = characterTriggers[i];
    if (trigger.enabledCriteria === null) continue;
    trigger.isEnabled = _criteriaMet(trigger.enabledCriteria, variables, functionBindings);
  }
}

function _findCharacterTriggerInText(responseText:string, characterTriggers:CharacterTrigger[]):CharacterTrigger|null {
  if (!characterTriggers.length) return null;
  let pos = 0;
  while(pos < responseText.length) {
    pos = responseText.indexOf('@', pos);  
    if (pos === -1) return null;
    const triggerCode = responseText[pos+1]; // TODO - support for more than 10 codes. Probably use a-zA-Z0-9 from a lookup array. It is more performant to use less chars.
    for(let triggerI = 0; triggerI < characterTriggers.length; ++triggerI) {
      const trigger = characterTriggers[triggerI];
      if (!trigger.isEnabled) continue;
      if (triggerCode === trigger.triggerCode) return trigger;
    }
    ++pos;
  }
  return null;
}

function _isLowerCaseAlphaChar(char:string):boolean {
  return char >= 'a' && char <= 'z';
}

function _doesTextContainPhrase(text:string, phrases:string[]):boolean {
  const _isAtWordBoundary = (_pos:number) => !_isLowerCaseAlphaChar(text[_pos]);
  
  text = text.toLowerCase();
  for(let phraseI = 0; phraseI < phrases.length; ++phraseI) {
    const phrase = phrases[phraseI].toLowerCase();
    let pos = 0;
    while (pos < text.length) {
      pos = text.indexOf(phrase, pos);
      if (pos === -1) break;
      if (_isAtWordBoundary(pos-1) && _isAtWordBoundary(pos+phrase.length)) return true;
      pos += phrase.length;
    }
  }
  return false;
}

function _defaultOnGenerate(_messages:LLMMessages):Promise<string> {
  console.warn('EncounterSession onGenerate() was not bound. Returning default response.');
  return Promise.resolve('onGenerate() was not bound.');
}

function _defaultOnCharacterMessage(text:string):void {
  console.warn('EncounterSession onCharacterMessage() was not bound. Message:', text);
}

function _defaultOnNarrationMessage(text:string):void {
  console.warn('EncounterSession onNarrationMessage() was not bound. Message:', text);
}

function _defaultOnPlayerMessage(text:string):void {
  console.warn('EncounterSession onPlayerMessage() was not bound. Message:', text);
}

class EncounterSession {
  private _encounter:Encounter|null;
  private _variables:VariableManager;
  private _onGenerate:GenerateCallback;
  private _onCharacterMessage:MessageCallback;
  private _onNarrationMessage:MessageCallback;
  private _onPlayerMessage:MessageCallback;
  private _llmMessages:LLMMessages;
  private _functionBindings:FunctionBinding[] = [];

  constructor(maxChatHistorySize:number = 100) {
    this._onGenerate = _defaultOnGenerate;
    this._onCharacterMessage = _defaultOnCharacterMessage;
    this._onNarrationMessage = _defaultOnNarrationMessage;
    this._onPlayerMessage = _defaultOnPlayerMessage;
    this._encounter = null;
    this._variables = new VariableManager();
    this._llmMessages = {
      chatHistory:[],
      maxChatHistorySize,
      systemMessage: null
    };
    this._functionBindings = [];
  }

  private _handleActions(actions:Action[]):
      {instructions:string, reprocess:boolean} {
    let reprocess = false;
    let instructions = '';
    for(let i = 0; i < actions.length; ++i) {
      const action = actions[i];
      switch(action.actionType) {
        case ActionType.NARRATION_MESSAGE:
          if (_criteriaMet(action.criteria, this._variables, this._functionBindings)) this._onNarrationMessage(action.messages.nextMessage());
        break;

        case ActionType.CHARACTER_MESSAGE:
          if (_criteriaMet(action.criteria, this._variables, this._functionBindings)) {
            const message = action.messages.nextMessage();
            this._onCharacterMessage(message);
            addAssistantMessageToChatHistory(this._llmMessages, message);
          }
        break;

        case ActionType.PLAYER_MESSAGE:
          if (_criteriaMet(action.criteria, this._variables, this._functionBindings)) {
            const message = action.messages.nextMessage();
            this._onPlayerMessage(message);
            addUserMessageToChatHistory(this._llmMessages, message);
          }
        break;
        
        case ActionType.INSTRUCTION_MESSAGE:
          if (_criteriaMet(action.criteria, this._variables, this._functionBindings)) {
            if (instructions.length) instructions += '\n';
            instructions += action.messages.nextMessage();
          }
        break;

        case ActionType.CODE:
          executeCode(action.code, this._variables, this._functionBindings);
        break;

        case ActionType.REPROCESS:
          if (_criteriaMet(action.criteria, this._variables, this._functionBindings)) reprocess = true;
        break;

        default:
          throw Error('Unexpected');
      }
    }
    return { instructions, reprocess };
  }

  private _appendMatchingMemoriesToChatHistory(playerText:string) {
    assertNonNullable(this._encounter);
    for(let i = 0; i < this._encounter.memories.length; ++i) {
      const memory = this._encounter.memories[i];
      if (!_doesTextContainPhrase(playerText, memory.matchPhrases) || !_criteriaMet(memory.enabledCriteria, this._variables, this._functionBindings)) continue;
      const { instructions } = this._handleActions(memory.actions); // TODO: it is possible for player and character messages to be displayed. Is that a bug or a feature?
      const memoryMessage = `I remember this about ${memory.matchPhrases[0]}: ${instructions}\nEND RETRIEVED CONTEXT`;
      if (this._llmMessages.chatHistory.find(m => m.content === memoryMessage)) continue; // Don't repeat memories already in context.
      addToolMessageToChatHistory(this._llmMessages, memoryMessage); // Message is added to end of chat history, so LLM has it for context, but not displayed.
    }
  }

  private _updateSystemMessage() { // Important: not idempotent. Variable state can change in _handleActions().
    assertNonNullable(this._encounter);
    _enableConditionalCharacterTriggers(this._encounter.characterTriggers, this._variables, this._functionBindings);
    let {instructions} = this._handleActions(this._encounter.instructionActions); 
    for(let i = 0; i < this._encounter.characterTriggers.length; ++i) {
      const { criteria, triggerCode, isEnabled } = this._encounter.characterTriggers[i];
      if (!isEnabled) continue;
      instructions += `\nIf ${criteria} then output @${triggerCode} and nothing else.`;
    }
    this._llmMessages.systemMessage = instructions;
  }

  private async _generateWithResponseHandling() {
    assertNonNullable(this._encounter);
    let reprocessCount = 0;
    const MAX_REPROCESS_COUNT = 3;
    while(++reprocessCount <= MAX_REPROCESS_COUNT) {
      this._updateSystemMessage();
      const responseText = await this._onGenerate(this._llmMessages);
      const characterTrigger = _findCharacterTriggerInText(responseText, this._encounter.characterTriggers);
      if (!characterTrigger) {
        const displayText = stripTriggerCodes(responseText);
        this._onCharacterMessage(displayText);
        return;
      } else {
        characterTrigger.isEnabled = false; // Prevent the same trigger from firing again in the future, unless it's re-enabled by the encounter's logic.
        const { reprocess } = this._handleActions(characterTrigger.actions);
        if (!reprocess) break;
      }
    }
  }

  async start(encounter:Encounter) {
    this._encounter = encounter;
    const {reprocess} = this._handleActions(this._encounter.startActions);
    this._llmMessages.chatHistory = [];
    if (reprocess) await this._generateWithResponseHandling();
  }

  async startFromUrl(encounterUrl:string) {
    const url = baseUrl(encounterUrl);
    const response = await fetch(url);
    if (!response.ok) throw Error(`Failed to load encounter from URL: ${encounterUrl}`);
    const text = await response.text();
    const encounter = _textToEncounter(text);
    return this.start(encounter);
  }

  async restart() {
    if (!this._encounter) throw Error('No encounter loaded');
    this._variables = new VariableManager();
    const {reprocess} = this._handleActions(this._encounter.startActions);
    this._llmMessages.chatHistory = [];
    if (reprocess) await this._generateWithResponseHandling();
  }

  async prompt(playerText:string) {
    if (!this._encounter) throw Error('No encounter loaded');
    this._appendMatchingMemoriesToChatHistory(playerText);
    addUserMessageToChatHistory(this._llmMessages, playerText);
    this._onPlayerMessage(playerText);
    await this._generateWithResponseHandling();
  }

  getVariables():VariableCollection {
    return this._variables.toCollection();
  }

  getSystemMessage():string {
    return this._llmMessages.systemMessage ?? 'undefined';
  }

  unbindAllFunctions() {
    this._onGenerate = _defaultOnGenerate;
    this._onCharacterMessage = _defaultOnCharacterMessage;
    this._onNarrationMessage = _defaultOnNarrationMessage;
    this._onPlayerMessage = _defaultOnPlayerMessage;
    this._functionBindings = [];
  }

  unbindFunction(functionName:string) {
    switch(functionName) {
      case 'onGenerate':
        this._onGenerate = _defaultOnGenerate;
      break;

      case 'onCharacterMessage':
        this._onCharacterMessage = _defaultOnCharacterMessage;
      break;

      case 'onNarrationMessage':
        this._onNarrationMessage = _defaultOnNarrationMessage;
      break;

      case 'onPlayerMessage':
        this._onPlayerMessage = _defaultOnPlayerMessage;
      break;

      default:
        this._functionBindings = this._functionBindings.filter(binding => binding.functionName !== functionName);
      break;
    }
  }

  bindFunction(func:Function, functionName?:string) {
    if (!functionName) functionName = func.name;
    const paramCount = func.length;
    this.unbindFunction(functionName);
    switch(functionName) {
      case 'onGenerate':
        assert(paramCount === 1);
        this._onGenerate = func as GenerateCallback;
      break;

      case 'onCharacterMessage':
        assert(paramCount === 1);
        this._onCharacterMessage = func as MessageCallback;
      break;

      case 'onNarrationMessage':
        assert(paramCount === 1);
        this._onNarrationMessage = func as MessageCallback;
      break;

      case 'onPlayerMessage':
        assert(paramCount === 1);
        this._onPlayerMessage = func as MessageCallback;
      break;

      default:
        this._functionBindings.push({ functionName, paramCount, function: func });
      break;
    }
  }
}

export default EncounterSession;
import { assert } from "decent-portal";
import { parseNameValueLines, parseSections } from "../markdownUtil";
import Encounter from "./types/Encounter";
import Action, { CodeAction, MessageAction } from "./types/Action";
import ActionType from "./types/ActionType";
import CharacterTrigger from "./types/CharacterTrigger";
import { parseVersion } from "../versionUtil";
import { textToCode } from "@/spielCode/codeUtil";

function _stripEnclosers(text:string, enclosingText:string):string {
  text = text.trim();
  assert(text.startsWith(enclosingText));
  return text.endsWith(enclosingText) 
    ? text.substring(enclosingText.length, text.length - enclosingText.length).trim()
    : text.substring(enclosingText.length).trim();
}

function _parseMessageAction(line:string, encloser:string, actionType:ActionType):Action {
  line = _stripEnclosers(line, encloser);
  const action:Action = { actionType, message:line, criteria:null } as Action;
  
  // Find a conditional code block if there is one.
  const startPos = line.indexOf('`');
  if (startPos === -1) return action;
  const endPos = line.indexOf('`', startPos+1);
  if (endPos === -1) return action;
  if (line.indexOf('`', endPos+1) !== -1) throw Error('Multiple code blocks found in message line - only one allowed.');
  const codeText = `result=${line.substring(startPos+1, endPos)}`; // "result=" - converts the concise expression format to a statement.
  (action as MessageAction).message = `${line.substring(0, startPos - 1)}${line.substring(endPos+1)}`;
  (action as MessageAction).criteria = textToCode(codeText);
  return action;
}

function _parseCodeAction(line:string):CodeAction {
  line = _stripEnclosers(line, '`');
  const code = textToCode(line);
  return { actionType:ActionType.CODE, code };
}

function _lineToAction(line:string):Action|null {
  if (line.startsWith('**')) return _parseMessageAction(line, '**', ActionType.INSTRUCTION_MESSAGE);
  if (line.startsWith('_')) return _parseMessageAction(line, '_', ActionType.NARRATION_MESSAGE);
  if (line.startsWith('>>')) return _parseMessageAction(line, '>>', ActionType.PLAYER_MESSAGE);
  if (line.startsWith('>')) return _parseMessageAction(line, '>', ActionType.CHARACTER_MESSAGE);
  if (line.startsWith('`')) return _parseCodeAction(line);
  return null;
}

function _parseActions(sectionContent:string):Action[] {
  const actions:Action[] = [];
  const lines = sectionContent.split('\n');
  for(let lineI = 0; lineI < lines.length; ++lineI) {
    const line = lines[lineI];
    if (line.startsWith('#')) break; // Can only be subsections from here on.
    const action = _lineToAction(line);
    if (action) actions.push(action);
  }
  return actions;
}

function _parseStartSection(startSection?:string):Action[] {
  if (!startSection) return [];
  return _parseActions(startSection);
}

function _parseTriggerSection(criteria:string, triggerCode:string, triggerSection:string):CharacterTrigger {
  const actions = _parseActions(triggerSection);
  return {
    criteria,
    triggerCode,
    actions
  }
}

function _parseInstructionSection(instructionSection?:string):[Action[], CharacterTrigger[]] {
  if (!instructionSection) return [[], []];
  const actions = _parseActions(instructionSection);
  const triggerSections = parseSections(instructionSection, 2);
  const triggerConditions = Object.keys(triggerSections);
  const triggers = triggerConditions.map((triggerCondition, triggerNo) => {
    const triggerCode = `${triggerNo}`;
    return _parseTriggerSection(triggerCondition, triggerCode, triggerSections[triggerCondition])
  });
  return [actions, triggers];
}

export function textToEncounter(text:string):Encounter {
  const version = parseVersion(text); // Throws if missing/invalid.
  const sections = parseSections(text);

  const generalSettings = sections.General ? parseNameValueLines(sections.General) : {}
  const title = generalSettings.title || 'Untitled Encounter';
  const model = generalSettings.model || 'default';

  const startActions = _parseStartSection(sections.Start);
  const [instructionActions, characterTriggers] = _parseInstructionSection(sections.Instructions);

  return {
    version, title, model, startActions, instructionActions, characterTriggers, sourceText:text 
  };
}
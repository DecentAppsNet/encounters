import { assert } from "decent-portal";
import { parseNameValueLines, parseSections } from "../markdownUtil";
import Encounter from "./types/Encounter";
import Action from "./types/Action";
import ActionType from "./types/ActionType";
import CharacterTrigger from "./types/CharacterTrigger";

function _stripEnclosers(text:string, enclosingText:string):string {
  text = text.trim();
  assert(text.startsWith(enclosingText));
  return text.endsWith(enclosingText) 
    ? text.substring(enclosingText.length, text.length - enclosingText.length).trim()
    : text.substring(enclosingText.length).trim();
}

function _lineToAction(line:string):Action|null {
  let action:Action|null = null;
  if (line.startsWith('**')) {
    action = {
      actionType:ActionType.INSTRUCTION_MESSAGE,
      payload:_stripEnclosers(line,'**')
    }
  } else if (line.startsWith('_')) {
    action = {
      actionType:ActionType.DISPLAY_MESSAGE,
      payload:_stripEnclosers(line,'_')
    }
  }
  return action;
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
  const sections = parseSections(text);

  const generalSettings = parseNameValueLines(sections.General);
  const version = generalSettings.version;
  if (!version) throw new Error('Encounter is missing version information in General section.');
  
  const title = generalSettings.title || 'Untitled Encounter';
  const model = generalSettings.model || 'default';

  const startActions = _parseStartSection(sections.Start);
  const [instructionActions, characterTriggers] = _parseInstructionSection(sections.Instructions);

  return {
    version, title, model, startActions, instructionActions, characterTriggers 
  };
}
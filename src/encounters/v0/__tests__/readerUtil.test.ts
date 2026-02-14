import { describe, expect, it } from 'vitest';

import  exampleText from './encounterExample';
import { textToEncounter } from '../readerUtil';
import ActionType from '../types/ActionType';
import { DisplayMessageAction, InstructionMessageAction } from '../types/Action';

describe('readerUtil', () => {
  it('reads a minimal text', () => {
    const encounter = textToEncounter('<!-- Encounter v0.1 -->');
    expect(encounter).toBeDefined();
    expect(encounter.title).toBe('Untitled Encounter');
    expect(encounter.version).toBe('0.1');
    expect(encounter.model).toBe('default');
    expect(encounter.startActions.length).toBe(0);
    expect(encounter.instructionActions.length).toBe(0);
    expect(encounter.characterTriggers.length).toBe(0);
  });

  it('throws an error for missing version', () => {
    expect(() => {
      textToEncounter('# General\n* title=No Version Encounter');
    }).toThrow();
  });

  it('reads an encounter text', () => {
    const encounter = textToEncounter(exampleText);
    expect(encounter).toBeDefined();
    expect(encounter.title).toBe('The Bridge Troll');
    expect(encounter.version).toBe('0.1');
    expect(encounter.model).toBe('Llama-3.1-8B-Instruct-q4f16_1-MLC-1k');
    expect(encounter.startActions.length).toBe(2);
    let a = encounter.startActions[0];
    expect(a.actionType).toBe(ActionType.NARRATION_MESSAGE);
    expect((a as DisplayMessageAction).messages.nextMessage()).toBe('As you attempt to cross a bridge, a troll emerges from beneath it, blocking your path. The troll seems disinclined to let you past.');
    expect(encounter.instructionActions.length).toBe(4);
    a = encounter.instructionActions[0];
    expect(a.actionType).toBe(ActionType.INSTRUCTION_MESSAGE);
    expect((a as InstructionMessageAction).messages.nextMessage()).toBe('You are a troll guarding a bridge. You want to know if the player wishes to cross your bridge.');
    expect(encounter.characterTriggers.length).toBe(4);
    const c = encounter.characterTriggers[0];
    expect(c.criteria).toBe("user says they want to cross the bridge");
    expect(c.actions.length).toBe(2);
    a = c.actions[0];
    expect(a.actionType).toBe(ActionType.CHARACTER_MESSAGE);
    expect(encounter.memories.length).toBe(3);
    const m = encounter.memories[1];
    expect(m.matchPhrases).toEqual(['me favorite color', 'color']);
    expect(m.actions.length).toBe(2);
    a = m.actions[0] as DisplayMessageAction;
    expect(a.actionType).toBe(ActionType.INSTRUCTION_MESSAGE);
    expect(a.messages.count).toBe(1);
    expect(a.messages.nextMessage()).toBe("it's brown. But I'll give no hint of it to strangers.");
    expect(a.criteria).not.toBeNull();
  });
});
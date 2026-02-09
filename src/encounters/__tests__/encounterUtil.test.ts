import { describe, expect, it } from 'vitest';
import { stripTriggerCodes, findCharacterTriggerInText } from '../encounterUtil';
import CharacterTrigger from '../v0/types/CharacterTrigger';

describe('encounterUtil', () => {
  describe('findCharacterTriggerInText()', () => {
    it('should find no triggers in empty string', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger).toBeNull();
    });

    it('should find no triggers in string with no codes', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "hi";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger).toBeNull();
    });

    it('should find no triggers in string with just a @', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "hi@";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger).toBeNull();
    });

    it('should find no triggers in string if code does not match a trigger', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "hi@3";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger).toBeNull();
    });

    it('should find no triggers in string if encounter does not have any triggers defined', () => {
      const characterTriggers:CharacterTrigger[] = [];
      const text = "@1";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger).toBeNull();
    });

    it('finds trigger by itself', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "@1";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger?.triggerCode).toBe('1');
    });

    it('finds trigger at beginning of text', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "@1Text";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger?.triggerCode).toBe('1');
    });

    it('finds triggers at end of text', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "Text@1";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger?.triggerCode).toBe('1');
    });

    it('finds trigger in middle of text', () => {
     const characterTriggers:CharacterTrigger[] = [
      {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
      {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "Text@1Text";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger?.triggerCode).toBe('1');
    });

    it('finds trigger if code has two @', () => {
      const characterTriggers:CharacterTrigger[] = [
        {'triggerCode':'1', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}, 
        {'triggerCode':'2', criteria:'', actions:[], isEnabled:true, enabledCriteria:null}];
      const text = "Text@@1Text";
      const trigger = findCharacterTriggerInText(text, characterTriggers);
      expect(trigger?.triggerCode).toBe('1');
    });
    
  });

  describe('stripTriggerCodes()', () => {
    it('returns empty string unchanged', () => {
      const input = "";
      const output = stripTriggerCodes(input);
      expect(output).toEqual(input);
    });

    it('returns text with no codes unchanged', () => {
      const input = "just an ordinary bit of text";
      const output = stripTriggerCodes(input);
      expect(output).toEqual(input);
    });

    it('should strip single trigger code', () => {
      const input = "You have succeeded! @1";
      const output = stripTriggerCodes(input);
      expect(output).toBe("You have succeeded! ");
    });

    it('strips trigger code by itself', () => {
      const input = "@1";
      const output = stripTriggerCodes(input);
      expect(output).toBe("");
    });

    it('strips two trigger codes by themselves', () => {
      const input = "@1@2";
      const output = stripTriggerCodes(input);
      expect(output).toBe("");
    });

    it('strips trigger code at beginning of text', () => {
      const input = "@1text";
      const output = stripTriggerCodes(input);
      expect(output).toBe("text");
    });

    it('strips trigger code at end of text', () => {
      const input = "text@1";
      const output = stripTriggerCodes(input);
      expect(output).toBe("text");
    });

    it('strips trigger code in middle of text', () => {
      const input = "te@1xt";
      const output = stripTriggerCodes(input);
      expect(output).toBe("text");
    });

    it('strips multiple trigger codes from text', () => {
      const input = "@2te@1xt@3";
      const output = stripTriggerCodes(input);
      expect(output).toBe("text");
    });
  });
});
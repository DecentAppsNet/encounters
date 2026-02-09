import { describe, expect, it } from 'vitest';

import { findStatementType } from "../statementUtil";
import StatementType from "../types/StatementType";

describe('statementUtil', () => {
  describe('findStatementType()', () => {
    describe('no parsable statement available', () => {
      it('throws for an empty line', () => {
        const rawStatement = {text:'', depth:0, statementOffset:0};
        expect(() => findStatementType(rawStatement, 0)).toThrow();
      });
      
      it('throws for a line that starts with a number', () => {
        const rawStatement = {text:'3', depth:0, statementOffset:0};
        expect(() => findStatementType(rawStatement, 0)).toThrow();
      });
      
      it('throws for a line that starts with a symbol character', () => {
        const rawStatement = {text:'*', depth:0, statementOffset:0};
        expect(() => findStatementType(rawStatement, 0)).toThrow();
      });
      
      it('throws for a line that starts with a space', () => {
        const rawStatement = {text:' ', depth:0, statementOffset:0};
        expect(() => findStatementType(rawStatement, 0)).toThrow();
      });
    });
    
    describe('assign statement handling', () => {
      it('handles a simple assign statement', () => {
        const rawStatement = {text:'x = 3', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.ASSIGN);
      });
      
      it('handles an assign statement with no spaces', () => {
        const rawStatement = {text:'x=3', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.ASSIGN);
      });
      
      it('handles an assign statement with whitespace', () => {
        const rawStatement = {text:'x   = \n   3', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.ASSIGN);
      });
      
      it('handles an assign statement with a complex expression', () => {
        const rawStatement = {text:'y = (7 + 3) * 2', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.ASSIGN);
      });
      
      it('handles an assign statement that begins with an underscore', () => {
        const rawStatement = {text:'_x = 3', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.ASSIGN);
      });
      
      it('handles an assign statement for a variable with multiple underscores', () => {
        const rawStatement = {text:'x_y_z = 3', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.ASSIGN);
      });
    });
    
    describe('function statement handling', () => {
      it('handles a simple function call', () => {
        const rawStatement = {text:'func()', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.CALL);
      });
      
      it('handles a function call with spaces', () => {
        const rawStatement = {text:'func ()', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.CALL);
      });
      
      it('handles a function call that begins with an underscore', () => {
        const rawStatement = {text:'_func()', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.CALL);
      });
      
      it('handles a function call for a function with multiple underscores', () => {
        const rawStatement = {text:'func_1_2()', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.CALL);
      });

      it('handles a function call for a function called "_if()"', () => {
        const rawStatement = {text:'_if()', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.CALL);
      });
      
      it('handles a function call with a single parameter', () => {
        const rawStatement = {text:'func(3)', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.CALL);
      });
    });
    
    describe('if statement handling', () => {
      it('handles a simple if statement', () => {
        const rawStatement = {text:'if (', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.IF);
      });
      
      it('handles an if statement with no spaces', () => {
        const rawStatement = {text:'if(', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.IF);
      });
      
      it('handles an if statement with spaces', () => {
        const rawStatement = {text:'if  (', depth:0, statementOffset:0};
        expect(findStatementType(rawStatement, 0)).toBe(StatementType.IF);
      });
    });
  });
});
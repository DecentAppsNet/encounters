import { textToRawStatements } from "../rawStatementUtil";

describe('rawStatementUtil', () => {
  describe('textToLines()', () => {
    it('returns an empty array when given an empty string', () => {
      expect(textToRawStatements('')).toEqual([]);
    });

    it('returns an array of one line when given a single statement', () => {
      expect(textToRawStatements('hello')).toEqual([{ 
        text: 'hello', depth: 0, statementOffset: 0 
      }]);
    });

    it('returns an array of two lines when given two statements separated by semicolons', () => {
      expect(textToRawStatements('hello;world')).toEqual([
        { text: 'hello', depth: 0, statementOffset: 0 }, 
        { text: 'world', depth: 0, statementOffset: 6 }
      ]);
    });
    
    it('strips whitespace from the beginning and end of lines', () => {
      expect(textToRawStatements(' hello ; world ')).toEqual([
        { text: 'hello', depth: 0, statementOffset: 1}, 
        { text: 'world', depth: 0, statementOffset: 9}
      ]);
    });
    
    it('omits empty lines', () => {
      expect(textToRawStatements('hello;;world')).toEqual([
        { text: 'hello', depth: 0, statementOffset: 0 }, 
        { text: 'world', depth: 0, statementOffset: 7 }
      ]);
    });
    
    it('increments depth when encountering an opening brace', () => {
      expect(textToRawStatements('hello{world}')).toEqual([
        { text: 'hello', depth: 0, statementOffset: 0 }, 
        { text: 'world', depth: 1, statementOffset: 6 }
      ]);
    });
    
    it('decrements depth when encountering a closing brace', () => {
      expect(textToRawStatements('{hello}world')).toEqual([
        { text: 'hello', depth: 1, statementOffset: 1 }, 
        { text: 'world', depth: 0, statementOffset: 7 }
      ]);
    });
    
    it('handles nested braces', () => {
      expect(textToRawStatements('{hello{world}}')).toEqual([
        { text: 'hello', depth: 1, statementOffset: 1 }, 
        { text: 'world', depth: 2, statementOffset: 7 }
      ]);
    });
  });
});
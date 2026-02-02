import { textToCode, executeCode } from "../codeUtil";
import VariableManager from "../VariableManager";
import CodePosition, {UNKNOWN_POSITION} from "../types/CodePosition";
import SpielCodeError from "../types/SpielCodeError";

describe('codeUtil', () => {
  function _runCode(text:string, variableManager?:VariableManager):any {
    const code = textToCode(text);
    const variables = variableManager ?? new VariableManager();
    executeCode(code, variables);
    return variables.get('result');
  }
  
  describe('assignment', () => {
    it('handles a simple assign statement', () => {
      expect(_runCode('result=3')).toEqual(3);
    });
    
    it('handles an assign statement with whitespace', () => {
      expect(_runCode('result   = \n   3')).toEqual(3);
    });
    
    it('handles an assign statement with a complex expression', () => {
      expect(_runCode('result = (7 + 3) * 2')).toEqual(20);
    });
    
    it('handles an assign statement that begins with an underscore', () => {
      expect(_runCode('_x = 3; result = _x;')).toEqual(3);
    });
    
    it('handles an assign statement for a variable with multiple underscores', () => {
      expect(_runCode('x_y_z = 3; result = x_y_z;')).toEqual(3);
    });
    
    it('throws an error if the variable name is invalid', () => {
      expect(() => _runCode('* = 3')).toThrow();
    });
  });
  
  describe('function calls', () => {
    it('handles a simple call statement', () => {
      expect(_runCode('rand(3,5)')).toBeUndefined();
    });
    
    it('calls a statement with whitespace', () => {
      expect(_runCode('rand   \n (  3 , 5 )')).toBeUndefined();
    });
    
    it('calls a statement with a complex expression', () => {
      expect(_runCode('rand((7 + (3 * j)), 5)')).toBeUndefined();
    });

    it('calls a function with no parameters', () => {
      expect(_runCode('restartSpiel()')).toBeUndefined();
    });
    
    it('throws an error is the function name begins with an invalid char', () => {
      expect(() => _runCode('@rand(3,5)')).toThrow();
    });

    it('throws an error is the function name ends with an invalid char', () => {
      expect(() => _runCode('rand@(3,5)')).toThrow();
    });
    
    it('throws an error if the function name is unknown/unsupported', () => {
      expect(() => _runCode('fetch("sendDataToSomeNastyWebsite")')).toThrow();
    });
    
    it('throws an error when the function call is missing its opening parenthesis', () => {
      expect(() => _runCode('rand 3,5)')).toThrow();
    });
    
    it('throws an error when the function call is missing its closing parenthesis', () => {
      expect(() => _runCode('rand(3,5')).toThrow();
    });
  });

  describe('conditional execution', () => {
    it('handles a simple if statement', () => {
      expect(_runCode('x=1; if (x===1) { result=3; }')).toEqual(3);
    });

    it('handles a simple if statement where statement block is not executed', () => {
      expect(_runCode('x=2; if (x===1) { result=3; }')).toEqual(undefined);
    });

    it('handles an if statement with a compound expression', () => {
      expect(_runCode('j=2; if (x===1 || j===2) { result=3; }')).toEqual(3);
    });

    it('handles an if statement with a multi-statement then code block', () => {
      expect(_runCode('x=1; if (x===1) { result=3; result=4; }')).toEqual(4);
    });

    it('handles an if statement with an else code block that is executed', () => {
      expect(_runCode('x=2; if (x===1) { result=3; } else { result=4; }')).toEqual(4);
    });
    
    it('handles an if statement with an else code block that is not executed', () => {
      expect(_runCode('x=1; if (x===1) { result=3; } else { result=4; }')).toEqual(3);
    });

    it('handles an if statement with an else if', () => {
      expect(_runCode('x=2; if (x===1) { result=3; } else if (x===2) { result=4; }')).toEqual(4);
    });

    it('handles an if statement with an else if and else', () => {
      expect(_runCode('x=0; if (x===1) { result=3; } else if (x===2) { result=4; } else { result=5; }')).toEqual(5);
    });

    it('handles an if statement with multiple else ifs', () => {
      expect(_runCode('x=2; if (x===1) { result=3; } else if (x===2) { result=4; } else if (x===3) { result=5; }')).toEqual(4);
    });

    it('handles an if statement with multiple else ifs and else', () => {
      expect(_runCode('x=3; if (x===1) { result=3; } else if (x===2) { result=4; } else if (x===3) { result=5; } else { result=6; }')).toEqual(5);
    });

    it('handles an if statement with another if statement nested in the then code block', () => {
      expect(_runCode('x=1; if (x===1) { if (x===1) { result=3; } }')).toEqual(3);
    });

    it('handles an if statement with a then block that calls a function', () => {
      expect(_runCode('x=1; if (x===1) { rand(1,3); }')).toBeUndefined();
    });

    it('throws an error if the if statement is missing its expression', () => {
      expect(() => _runCode('if () { result=3; }')).toThrow();
    });

    it('throws an error if the if statement is missing its then code block', () => {
      expect(() => _runCode('if (x===1)')).toThrow();
    });

    it('throws an error if the else if statement is missing its expression', () => {
      expect(() => _runCode('if (x===1) { result=3; } else if () { result=4; }')).toThrow();
    });

    it('throws an error if the else if statement is missing its then code block', () => {
      expect(() => _runCode('if (x===1) { result=3; } else if (x===2)')).toThrow();
    });

    it('throws an error if the else statement is missing its code block', () => {
      expect(() => _runCode('if (x===1) { result=3; } else')).toThrow();
    });
    
    it('throws an error if condition expression is missing opening parenthesis', () => {
      expect(() => _runCode('if x===1) { result=3; }')).toThrow();
    });
    
    it('throws an error if condition expression is missing closing parenthesis', () => {
      expect(() => _runCode('if (x===1 { result=3; }')).toThrow();
    });
    
    it('throws an error if then code block is missing opening brace', () => {
      expect(() => _runCode('if (x===1) result=3; }')).toThrow();
    });
    
    it('throws an error if then code block is missing closing brace', () => {
      expect(() => _runCode('if (x===1) { result=3;')).toThrow();
    });
    
    it('throws an error if else if statement is missing opening parenthesis', () => {
      expect(() => _runCode('if (x===1) { result=3; } else if x===2) { result=4; }')).toThrow();
    });
    
    it('throws an error if else if statement is missing closing parenthesis', () => {
      expect(() => _runCode('if (x===1) { result=3; } else if (x===2 { result=4; }')).toThrow();
    });
    
    it('throws an error if else if statement is missing opening brace', () => {
      expect(() => _runCode('if (x===1) { result=3; } else if (x===2) result=4; }')).toThrow();
    });
    
    it('throws an error if else if statement is missing closing brace', () => {
      expect(() => _runCode('if (x===1) { result=3; } else if (x===2) { result=4;')).toThrow();
    });
  });
  
  describe('expression parsing', () => {
    it('returns empty expression from empty text', () => {
      expect(_runCode('result=')).toBeUndefined();
    });

    it('parses one-variable expression', () => {
      expect(_runCode('result=y')).toBeUndefined();
    });

    it('throws when two variables are next to each other', () => {
      expect(() => _runCode('result=x y')).toThrowError('Two variables cannot be next to each other');
    });

    it('throws when two literals are next to each other', () => {
      expect(() => _runCode('result=123 456')).toThrowError('Two literals cannot be next to each other');
    });

    it('throws when a number has two decimal points', () => {
      expect(() => _runCode('result=12.3.7')).toThrowError('Two literals cannot be next to each other');
    });

    it('throws when a left parenthesis is not followed by a right parenthesis', () => {
      expect(() => _runCode('result=(hello')).toThrowError('Expression is missing a closing parenthesis');
    });

    it('throws when a right parenthesis is not preceded by a left parenthesis', () => {
      expect(() => _runCode('result=hello)')).toThrowError('Right parenthesis without left parenthesis');
    });

    it('throws when a string literal does not have a closing quote', () => {
      expect(() => _runCode("result='hello")).toThrowError('Missing closing \' for string literal');
    });

    it('an unsupported operand throws', () => {
      expect(() => _runCode("result=123^456")).toThrow();
    });

    it('a multi-character unsupported operand throws', () => {
      expect(() => _runCode("result=123%%%456")).toThrow();
    });

    it('throws an error for an assignment with a bad variable name', () => {
      expect(() => _runCode('2result=123', new VariableManager())).toThrow();
    });
  });

  describe('variable conversion to literals', () => { 
    it('returns the value of a string variable', () => {
      const variables = new VariableManager();
      variables.set('greeting', 'hello world');
      expect(_runCode('result=greeting', variables)).toEqual('hello world');
    });

    it('returns the value of a numeric variable', () => {
      const variables = new VariableManager();
      variables.set('number', 123);
      expect(_runCode('result=number', variables)).toEqual(123);
    });

    it('returns the value of a boolean variable', () => {
      const variables = new VariableManager();
      variables.set('flag', true);
      expect(_runCode('result=flag', variables)).toEqual(true);
    });

    it('returns the value of an object variable', () => {
      const variables = new VariableManager();
      variables.set('obj', { a: 1, b: 'two' });
      expect(_runCode('result=obj', variables)).toEqual({ a: 1, b: 'two' });
    });

    it('returns the value of a null variable', () => {
      const variables = new VariableManager();
      variables.set('obj', null);
      expect(_runCode('result=obj', variables)).toEqual(null);
    });

    it('returns undefined for an undefined variable', () => {
      expect(_runCode('result=someVariable')).toBeUndefined();
    });

    it('evaluates two variables on each side of an operation', () => {
      const variables = new VariableManager();
      variables.set('a', 2);
      variables.set('b', 3);
      expect(_runCode('result=a+b', variables)).toEqual(5);
    });
  });

  describe('single operations', () => {

    it('evaluates unary minus operation', () => {
      expect(_runCode('result=-123')).toEqual(-123);
    });

    it('evaluates division operation', () => {
      expect(_runCode('result=12/4')).toEqual(3);
    });

    it('evaluates division operation with floats', () => {
      expect(_runCode('result=12/5')).toEqual(2.4);
    });

    it('evaluates multiplication operation', () => {
      expect(_runCode('result=12*4')).toEqual(48);
    });

    it('evaluates addition operation', () => {
      expect(_runCode('result=12+4')).toEqual(16);
    });

    it('concatenates two strings', () => {
      expect(_runCode("result='hello' + 'world'")).toEqual('helloworld');
    });

    it('evaluates subtraction operation', () => {
      expect(_runCode('result=12-4')).toEqual(8);
    });

    it('evaluates less than operation', () => {
      expect(_runCode('result=12<4')).toEqual(false);
    });

    it('evaluates less than or equal to operation', () => {
      expect(_runCode('result=12<=12')).toEqual(true);
    });

    it('evaluates greater than operation', () => {
      expect(_runCode('result=12>4')).toEqual(true);
    });

    it('evaluates greater than or equal to operation', () => {
      expect(_runCode('result=12>=12')).toEqual(true);
    });

    it('evaluates equal to operation', () => {
      expect(_runCode('result=12===12')).toEqual(true);
    });

    it('evaluates not equal to operation', () => {
      expect(_runCode('result=12!==12')).toEqual(false);
    });

    it('evaluates logical and operation', () => {
      expect(_runCode('result=true&&false')).toEqual(false);
    });

    it('evaluates logical and operations with numbers', () => {
      expect(_runCode('result=12&&0')).toEqual(0);
    });

    it('evaluates logical or operation', () => {
      expect(_runCode('result=true||false')).toEqual(true);
    });

    it('evaluates logical or operations with numbers', () => {
      expect(_runCode('result=12||0')).toEqual(12);
    });

    it('evaluates logical not operation', () => {
      expect(_runCode('result=!true')).toEqual(false);
    });

    it('evaluates logical not operation with numbers', () => {
      expect(_runCode('result=!12')).toEqual(false);
    });

    it('evaluates logical not operation with strings', () => {
      expect(_runCode('result=!\'hello\'')).toEqual(false);
    });
  });

  describe('combinations of arithmetic operations', () => {
    it('adds 3 numbers', () => {
      expect(_runCode('result=1+2+3')).toEqual(6);
    });

    it('adds 5 numbers', () => {
      expect(_runCode('result=1 + 2 + 3 + 4 + 5')).toEqual(15);
    });

    it('multiplies a positive and negative number', () => {
      expect(_runCode('result=-2*3')).toEqual(-6);
    });

    it('multiplies and divides', () => {
      expect(_runCode('result=3*4/6')).toEqual(2);
    });

    it('multiplication performed before addition', () => {
      expect(_runCode('result=3+5*6')).toEqual(33);
    });

    it('multiplication performed before subtraction', () => {
      expect(_runCode('result=3-5*6')).toEqual(-27);
    });

    it('two multiplication operations performed before an addition', () => {
      expect(_runCode('result=1+3*5*6')).toEqual(91);
    });

    it('three multiplication operations performed before an addition', () => {
      expect(_runCode('result=1+3*5*6*2')).toEqual(181);
    });

    it('two multiplication operations performed before an addition operation of their results', () => {
      expect(_runCode('result=2*3+5*6')).toEqual(36);
    });

    it('multiplies two negative numbers', () => {
      expect(_runCode('result=-2*-3')).toEqual(6);
    });

    it('returns a decimal result', () => {
      expect(_runCode('result=1/3')).toEqual(1/3);
    });

    it('returns a decimal result with a negative number', () => {
      expect(_runCode('result=-1/3')).toEqual(-1/3);
    });

    it('subtracts a negative number', () => {
      expect(_runCode('result=1--3')).toEqual(4);
    });

    it('multiplies two decimals', () => {
      expect(_runCode('result=1.2*3.4')).toEqual(4.08);
    });

    it('evaluates operation inside of parentheses first', () => {
      expect(_runCode('result=3*(1+2)')).toEqual(9);
    });

    it('negates result of an operation inside of parentheses', () => {
      expect(_runCode('result=-(1+2)')).toEqual(-3);
    });

    it('evaluates two parentheses-grouped operations before multiplying result', () => {
      expect(_runCode('result=(1+2)*(3+4)')).toEqual(21);
    });

    it('evaluates nested parentheses', () => {
      expect(_runCode('result=1+((1+2)*(3+4))')).toEqual(22);
    });

    it('evaluates with deep nesting at end', () => {
      expect(_runCode('result=-5 + (4 * (3 + (7 - 2)))')).toEqual(-5 + (4 * (3 + (7 - 2))));
    });

    it('evaluates with deep nesting at beginning', () => {
      expect(_runCode('result=(4 * (3 + (7 - 2))) - 5')).toEqual((4 * (3 + (7 - 2))) - 5);
    });

    it('evaluates with deep nesting at beginning and end', () => {
      expect(_runCode('result=(4 * (3 + (7 - 2))) - 5 + (6 + ((7 + 2) * 3 + 1))')).toEqual((4 * (3 + (7 - 2))) - 5 + (6 + ((7 + 2) * 3 + 1)));
    });
  });

  describe('boolean operations', () => {
    it('evaluates true and false to false', () => {
      expect(_runCode('result=true&&false')).toEqual(false);
    });

    it('evaluates true and true to true', () => {
      expect(_runCode('result=true&&true')).toEqual(true);
    });

    it('evaluates false and true to false', () => {
      expect(_runCode('result=false&&true')).toEqual(false);
    });

    it('evaluates false and false to false', () => {
      expect(_runCode('result=false&&false')).toEqual(false);
    });

    it('evaluates true or false to true', () => {
      expect(_runCode('result=true||false')).toEqual(true);
    });

    it('evaluates true or true to true', () => {
      expect(_runCode('result=true||true')).toEqual(true);
    });

    it('evaluates false or true to true', () => {
      expect(_runCode('result=false||true')).toEqual(true);
    });

    it('evaluates false or false to false', () => {
      expect(_runCode('result=false||false')).toEqual(false);
    });

    it('evaluates not true to false', () => {
      expect(_runCode('result=!true')).toEqual(false);
    });

    it('evaluates not false to true', () => {
      expect(_runCode('result=!false')).toEqual(true);
    });

    it('evaluates !0 to true', () => {
      expect(_runCode('result=!0')).toEqual(true);
    });

    it('evaluates !1 to false', () => {
      expect(_runCode('result=!1')).toEqual(false);
    });

    it('evaluates !-1 to false', () => {
      expect(_runCode('result=!-1')).toEqual(false);
    });
  });

  describe('equality operators', () => {
    it('evaluates 1===1 to true', () => {
      expect(_runCode('result=1===1')).toEqual(true);
    });

    it('evaluates 1===2 to false', () => {
      expect(_runCode('result=1===2')).toEqual(false);
    });

    it('evaluates 1!==1 to false', () => {
      expect(_runCode('result=1!==1')).toEqual(false);
    });

    it('evaluates 1!==2 to true', () => {
      expect(_runCode('result=1!==2')).toEqual(true);
    });

    it('evaluates 1===true to false', () => {
      expect(_runCode('result=1===true')).toEqual(false);
    });

    it('evaluates 1!==true to true', () => {
      expect(_runCode('result=1!==true')).toEqual(true);
    });

    it('evaluates 1===false to false', () => {
      expect(_runCode('result=1===false')).toEqual(false);
    });

    it('evaluates 1!==false to true', () => {
      expect(_runCode('result=1!==false')).toEqual(true);
    });
  });

  describe('greater than operators', () => {
    it('evaluates 1>1 to false', () => {
      expect(_runCode('result=1>1')).toEqual(false);
    });

    it('evaluates 1>2 to false', () => {
      expect(_runCode('result=1>2')).toEqual(false);
    });

    it('evaluates 2>1 to true', () => {
      expect(_runCode('result=2>1')).toEqual(true);
    });

    it('evaluates 1>=1 to true', () => {
      expect(_runCode('result=1>=1')).toEqual(true);
    });

    it('evaluates 1>=2 to false', () => {
      expect(_runCode('result=1>=2')).toEqual(false);
    });

    it('evaluates 2>=1 to true', () => {
      expect(_runCode('result=2>=1')).toEqual(true);
    });
  });

  describe('less than operators', () => {
    it('evaluates 1<1 to false', () => {
      expect(_runCode('result=1<1')).toEqual(false);
    });

    it('evaluates 1<2 to true', () => {
      expect(_runCode('result=1<2')).toEqual(true);
    });

    it('evaluates 2<1 to false', () => {
      expect(_runCode('result=2<1')).toEqual(false);
    });

    it('evaluates 1<=1 to true', () => {
      expect(_runCode('result=1<=1')).toEqual(true);
    });

    it('evaluates 1<=2 to true', () => {
      expect(_runCode('result=1<=2')).toEqual(true);
    });

    it('evaluates 2<=1 to false', () => {
      expect(_runCode('result=2<=1')).toEqual(false);
    });
  });
  
  describe('code position for errors', () => {
    function _runThrowingCode(text:string, nodeNo?:number):CodePosition {
      try {
        const code = textToCode(text, nodeNo);
        executeCode(code, new VariableManager(), nodeNo);
      } catch(e) {
        if (e instanceof SpielCodeError) return e.codePosition;
        throw e;
      }
      throw Error('Expected an error');
    }
    
    it('returns correct code position for an interpretation error within a simple statement', () => {
      expect(_runThrowingCode('result=%%%')).toEqual({nodeNo:UNKNOWN_POSITION, lineNo:0, charNo: 7});
    });
    
    it('returns correct code position for an interpretation error within a statement with a line break', () => {
      expect(_runThrowingCode('\nresult=%%%')).toEqual({nodeNo:UNKNOWN_POSITION, lineNo:1, charNo: 7});
    });
    
    it('returns correct code position for an interpretation error within a statement with multiple line breaks', () => {
      expect(_runThrowingCode('\n\nresult=%%%\nresult=3')).toEqual({nodeNo:UNKNOWN_POSITION, lineNo:2, charNo: 7});
    });
    
    it('returns correct code position for an interpretation error within a statement with multiple line breaks and a nodeNo', () => {
      expect(_runThrowingCode('\n\nresult=%%%\nresult=3', 5)).toEqual({nodeNo:5, lineNo:2, charNo: 7});
    });
    
    it('returns correct code position for an interpretation error within a statement with multiple line breaks and a nodeNo', () => {
      expect(_runThrowingCode('\n\nresult=%%%\nresult=3', 5)).toEqual({nodeNo:5, lineNo:2, charNo: 7});
    });
  });
});
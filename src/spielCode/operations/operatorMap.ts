import {ExpressionToken} from "../types/Expression";
import { logicalAnd, LOGICAL_AND_CODE} from "./logicalAnd";
import { logicalOr, LOGICAL_OR_CODE} from "./logicalOr";
import { logicalNot, LOGICAL_NOT_CODE} from "./logicalNot";
import { divide, DIVIDE_CODE} from "./divide";
import { greaterThan, GREATER_THAN_CODE } from "./greaterThan";
import { greaterThanEqual, GREATER_THAN_EQUAL_CODE } from "./greaterThanEqual";
import { lessThan, LESS_THAN_CODE } from "./lessThan";
import { lessThanEqual, LESS_THAN_EQUAL_CODE } from "./lessThanEqual";
import { minus, convertTokenToUnaryMinusIfAppropriate, MINUS_CODE } from "./minus";
import { multiply, MULTIPLY_CODE } from "./multiply";
import { plus, PLUS_CODE } from "./plus";
import { strictEqual, STRICT_EQUAL_CODE } from "./strictEqual";
import { strictNotEqual, STRICT_NOT_EQUAL_CODE } from "./strictNotEqual";
import { unaryMinus, UNARY_MINUS_CODE} from "./unaryMinus";

export type EvaluationFunction = (leftValue:any, rightValue:any) => any;
type ConvertTokenFunction = (token:ExpressionToken[], index:number) => void;

type OperatorMapEntry = {
  evaluationFunction: EvaluationFunction,
  convertTokenFunction?: ConvertTokenFunction,
  useLeft: boolean, // Whether the operation uses the left operand. E.g. "unary-" does not.
  useRight: boolean, // Whether the operation uses the right operand.
  symbol: string, // The symbol that represents the operation in the expression. E.g. "+".
  code: string, // The code that represents the operation in the code. E.g. "unary+".
  order: number // Order of operations between 0 and 99. Lower numbers are evaluated first. Ties resolve order left-to-right between operands.
}

type OperatorMap = {
  [code:string]: OperatorMapEntry
}

function _codeToSymbol(code:string):string {
  // Remove any alpha-numeric characters from the code. E.g. "unary+" becomes "+".
  return code.replace(/[a-zA-Z]/g, '');
}

/* Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

   Intentionally omitted:
   * ++ and --, because I want expression evaluation to be side-effect free.
   * Loose equality (==) and inequality (!=). The concept of coercion is not worth the complexity.
   * Assignment operands. Mixing evaluation and assignment leads to errors.
   * Lots of other stuff, e.g. bitwise, ternary, etc. Unlikely to be useful. Not worth the complexity.
 */
function _createOperatorMap():OperatorMap {
  return {
    [LOGICAL_NOT_CODE]: { evaluationFunction: logicalNot, symbol: _codeToSymbol(LOGICAL_NOT_CODE), code: LOGICAL_NOT_CODE, useLeft:false, useRight:true, order:10 },
    [UNARY_MINUS_CODE]: { evaluationFunction: unaryMinus, symbol: _codeToSymbol(UNARY_MINUS_CODE), code: UNARY_MINUS_CODE, useLeft:false, useRight:true, order:10},

    [MULTIPLY_CODE]: { evaluationFunction: multiply, symbol: _codeToSymbol(MULTIPLY_CODE), code: MULTIPLY_CODE, useLeft:true, useRight:true, order:20 },
    [DIVIDE_CODE]: { evaluationFunction: divide, symbol: _codeToSymbol(DIVIDE_CODE), code: DIVIDE_CODE, useLeft:true, useRight:true, order:20 },

    [MINUS_CODE]: { evaluationFunction: minus, symbol: _codeToSymbol(MINUS_CODE), code: MINUS_CODE, useLeft:true, useRight:true, order:25, convertTokenFunction:convertTokenToUnaryMinusIfAppropriate },
    [PLUS_CODE]: { evaluationFunction: plus, symbol: _codeToSymbol(PLUS_CODE), code: PLUS_CODE, useLeft:true, useRight:true, order:25 },

    [GREATER_THAN_CODE]: { evaluationFunction: greaterThan, symbol: _codeToSymbol(GREATER_THAN_CODE), code: GREATER_THAN_CODE, useLeft:true, useRight:true, order:30 },
    [GREATER_THAN_EQUAL_CODE]: { evaluationFunction: greaterThanEqual, symbol: _codeToSymbol(GREATER_THAN_EQUAL_CODE), code: GREATER_THAN_EQUAL_CODE, useLeft:true, useRight:true, order:30 },
    [LESS_THAN_CODE]: { evaluationFunction: lessThan, symbol: _codeToSymbol(LESS_THAN_CODE), code: LESS_THAN_CODE, useLeft:true, useRight:true, order:30 },
    [LESS_THAN_EQUAL_CODE]: { evaluationFunction: lessThanEqual, symbol: _codeToSymbol(LESS_THAN_EQUAL_CODE), code: LESS_THAN_EQUAL_CODE, useLeft:true, useRight:true, order:30 },

    [STRICT_EQUAL_CODE]: { evaluationFunction: strictEqual, symbol: _codeToSymbol(STRICT_EQUAL_CODE), code: STRICT_EQUAL_CODE, useLeft:true, useRight:true, order:35 },
    [STRICT_NOT_EQUAL_CODE]: { evaluationFunction: strictNotEqual, symbol: _codeToSymbol(STRICT_NOT_EQUAL_CODE), code: STRICT_NOT_EQUAL_CODE, useLeft:true, useRight:true, order:35 },

    [LOGICAL_AND_CODE]: { evaluationFunction: logicalAnd, symbol: _codeToSymbol(LOGICAL_AND_CODE), code: LOGICAL_AND_CODE, useLeft:true, useRight:true, order:40 },
    
    [LOGICAL_OR_CODE]: { evaluationFunction: logicalOr, symbol: _codeToSymbol(LOGICAL_OR_CODE), code: LOGICAL_OR_CODE, useLeft:true, useRight:true, order:45 }
  };
}

function _createOperatorChars(operatorSymbols:string[]):{ [key:string]:boolean } {
  const operandChars:{ [key:string]:boolean } = {};
  for(let i = 0; i < operatorSymbols.length; ++i) {
    const symbol = operatorSymbols[i];
    for(let j = 0; j < symbol.length; ++j) {
      operandChars[symbol[j]] = true;
    }
  }
  return operandChars;
}

export const OPERATOR_MAP:OperatorMap = _createOperatorMap();

export const OPERATOR_SYMBOLS:string[] = Object.keys(OPERATOR_MAP).map((key:string) => OPERATOR_MAP[key].symbol);

export const OPERATOR_CHARS:{ [key:string]:boolean } = _createOperatorChars(OPERATOR_SYMBOLS);
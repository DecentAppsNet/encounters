import {ExpressionToken, ExpressionTokenType} from "../types/Expression";
import {UNARY_MINUS_CODE} from "./unaryMinus";

export function minus(leftOperand:any, rightOperand:any):any {
  return leftOperand - rightOperand;
}

export function convertTokenToUnaryMinusIfAppropriate(tokens:ExpressionToken[], index:number):void {
  if (index === 0 || // e.g. "-1", "- 1". 
    tokens[index-1].tokenType === ExpressionTokenType.OPERATOR) {  // e.g. "5 * -1", "5 * (-1)"
    tokens[index].value = UNARY_MINUS_CODE;
  }
}

export const MINUS_CODE = '-';
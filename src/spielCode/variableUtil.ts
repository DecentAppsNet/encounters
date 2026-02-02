import {isAlpha, isAlphaNumeric} from "../common/charUtil";
import {TokenResult} from "./types/TokenResult";
import {ExpressionToken, ExpressionTokenType, OperationBinding} from "./types/Expression";
import VariableManager from "./VariableManager";

export function isVariable(text:string, startPos:number):boolean {
  const c = text[startPos];
  return isAlpha(c) || c === '_';
}

export function parseVariable(text:string, depth:number, startPos:number, _sourceOffset:number):TokenResult {
  let value = '';
  while(startPos < text.length && isAlphaNumeric(text[startPos]) || text[startPos] === '_') {
    value += text[startPos];
    ++startPos;
  }
  return { token: { tokenType: ExpressionTokenType.VARIABLE, value, depth, operationNo:null }, endPos: startPos };
}

function _isAVariableToken(maybeAToken:ExpressionToken|number|null):boolean {
  if (maybeAToken === null || typeof maybeAToken === 'number') return false;
  return maybeAToken.tokenType === ExpressionTokenType.VARIABLE;
}

function _variableToLiteralToken(token:ExpressionToken, variableManager:VariableManager):ExpressionToken {
  const variableName:string = token.value;
  const value = variableManager.get(variableName);
  return { tokenType:ExpressionTokenType.LITERAL, value, depth:token.depth, operationNo:null };
}

export function replaceVariableTokensWithLiterals(operationBindings:OperationBinding[], variableManager:VariableManager) {
  for(let i = 0; i < operationBindings.length; ++i) {
    const operationBinding = operationBindings[i];
    const { leftToken, rightToken } = operationBinding;
    if (_isAVariableToken(leftToken)) operationBinding.leftToken = _variableToLiteralToken(leftToken as ExpressionToken, variableManager);
    if (_isAVariableToken(rightToken)) operationBinding.rightToken = _variableToLiteralToken(rightToken as ExpressionToken, variableManager);
  }
}
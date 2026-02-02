import {isAlphaNumeric, isNumeric} from "../common/charUtil";
import {TokenResult} from "./types/TokenResult";
import {ExpressionTokenType} from "./types/Expression";
import SpielCodeError from "./types/SpielCodeError";
import {createStatementCodePosition} from "./codePositionUtil";

export function isBooleanLiteral(text:string, startPos:number):boolean {
  function _checkForText(text:string, startPos:number, checkText:string):boolean {
    let i = 0;
    for(; i < checkText.length; ++i) {
      const c= text[startPos+i];
      if (!isAlphaNumeric(c)) break;
      if (text[startPos+i] !== checkText[i]) return false;
    }
    return i === checkText.length;
  }

  if (_checkForText(text, startPos, 'true')) return true;
  return _checkForText(text, startPos, 'false');
}

const TRUE_LENGTH = 'true'.length;
const FALSE_LENGTH = 'false'.length;
export function parseBooleanLiteral(text:string, depth:number, startPos:number, _sourceOffset:number):TokenResult {
  const value = text.startsWith('true', startPos);
  return { token: { tokenType: ExpressionTokenType.LITERAL, value, depth, operationNo:null }, endPos: startPos + (value ? TRUE_LENGTH : FALSE_LENGTH) };
}

export function isNumericLiteral(text:string, startPos:number):boolean {
  const c = text[startPos];
  return c === '.' || isNumeric(c);
}

// Note: a preceding negative sign is always treated as an operator separate from the literal. So "-123" is parsed like "- 123".
export function parseNumericLiteral(text:string, depth:number, startPos:number, _sourceOffset:number):TokenResult {
  let valueText = '';
  let decimalFound = false;
  while(startPos < text.length) {
    const c = text[startPos];
    if (c === '.') {
      if (decimalFound) break;
      decimalFound = true;
    } else {
      if (!isNumeric(c)) break;
    }
    valueText += text[startPos];
    ++startPos;
  }
  const value = parseFloat(valueText);
  return { token: { tokenType: ExpressionTokenType.LITERAL, value, depth, operationNo:null }, endPos: startPos };
}

export function isStringLiteral(text:string, startPos:number):boolean {
  return text[startPos] === "'";
}

export function parseStringLiteral(text:string, depth:number, startPos:number, sourceOffset:number):TokenResult {
  let value = '';
  ++startPos;
  while(startPos < text.length && text[startPos] !== "'") {
    value += text[startPos];
    ++startPos;
  }
  if (startPos === text.length) throw new SpielCodeError('Missing closing \' for string literal', createStatementCodePosition(sourceOffset, startPos));
  return { token: { tokenType: ExpressionTokenType.LITERAL, value, depth, operationNo:null }, endPos: startPos+1 };
}
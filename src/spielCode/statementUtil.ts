import RawStatement from "./types/RawStatement";
import StatementType from "./types/StatementType";
import {isAlpha, isAlphaNumeric} from "../common/charUtil";
import SpielCodeError from "./types/SpielCodeError";
import {createStatementCodePosition} from "./codePositionUtil";

export function findVariableOrFunctionNameEnd(text:string):number {
  const firstChar = text[0];
  if (!isAlpha(firstChar) && firstChar !== '_') return -1;
  
  for(let i = 0; i < text.length; ++i) {
    if (!isAlphaNumeric(text[i]) && text[i] !== '_') return i;
  }
  
  return text.length;
}

// This function doesn't need to verify the correctness of a statement's syntax, but rather just find the only kind of 
// statement it *could* be based on minimal parsing.
export function findStatementType(rawStatement:RawStatement, statementOffset:number):StatementType {
  if (rawStatement.text.startsWith('if')) return StatementType.IF;
  
  const variableOrFunctionNameEnd = findVariableOrFunctionNameEnd(rawStatement.text);
  if (variableOrFunctionNameEnd === -1) throw new SpielCodeError(`Invalid symbol name in statement: "${rawStatement.text}"`, createStatementCodePosition(statementOffset, 0));
  const afterName = rawStatement.text.slice(variableOrFunctionNameEnd).trim();
  
  if (afterName.startsWith('=')) return StatementType.ASSIGN;
  if (afterName.startsWith('(')) return StatementType.CALL;
  
  throw new SpielCodeError(`Could not parse statement: "${rawStatement.text}"`, createStatementCodePosition(statementOffset, 0));
}
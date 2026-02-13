import CallStatement from "../types/CallStatement";
import StatementType from "../types/StatementType";
import {findVariableOrFunctionNameEnd} from "../statementUtil";
import Expression from "../types/Expression";
import {expressionToValue, textToExpression} from "../expressionUtil";
import VariableManager from "../VariableManager";
import RawStatement from "../types/RawStatement";
import SpielCodeError from "../types/SpielCodeError";
import {createStatementCodePosition} from "../codePositionUtil";
import { assert } from "decent-portal";

function _getFunction(functionName:string, functionNameOffset:number):Function {
  switch(functionName) {
    case 'rand': return (from:number, to:number) => Math.floor(Math.random() * (to - from + 1)) + from;
    case 'restartSpiel': return () => { /* TODO */ };
    default: throw new SpielCodeError(`Unknown function: "${functionName}"`, createStatementCodePosition(functionNameOffset, 0));
  }
}

function _parseParams(statementText:string, statementOffset:number):Expression[] {
  const leftParenPos = statementText.indexOf('(');
  const rightParenPos = statementText.lastIndexOf(')');
  if (leftParenPos === -1 || rightParenPos === -1) throw new SpielCodeError(`Missing parentheses in function call`, createStatementCodePosition(statementOffset, 0));

  const paramsText = statementText.slice(leftParenPos + 1, rightParenPos);
  const params = paramsText.split(',').map(param => param.trim());
  let offset = leftParenPos + 1;
  const paramExpressions:Expression[] = [];
  for(let i = 0; i < params.length; ++i) {
    const param = params[i];
    offset = statementText.indexOf(param, offset);
    assert(offset > -1);
    if (param.length === 0) return [];
    paramExpressions.push(textToExpression(param, statementOffset + offset));
    offset += param.length;
  }
  return paramExpressions;
}

function _parseFunctionName(statementText:string, statementOffset:number):string {
  const endPos = findVariableOrFunctionNameEnd(statementText);
  /* v8 ignore next */ // This is a good guard, but earlier code is currently preventing the condition that would be tested here.
  if (endPos === -1) throw new SpielCodeError(`Invalid function name`, createStatementCodePosition(statementOffset, 0));
  return statementText.slice(0, endPos);
}

export function parseCallStatement(rawStatement:RawStatement):CallStatement {
  const functionName = _parseFunctionName(rawStatement.text, rawStatement.statementOffset);
  const _function = _getFunction(functionName, rawStatement.statementOffset);
  const parameters = _parseParams(rawStatement.text, rawStatement.statementOffset);
  const statementOffset = rawStatement.statementOffset;
  return {statementType:StatementType.CALL, functionName, function:_function, parameters, statementOffset};
}

export function executeCallStatement(statement:CallStatement, variables:VariableManager):void {
  const paramValues = statement.parameters.map(param => expressionToValue(param, variables));
  try {
    statement.function(...paramValues);
  } catch(error) {
    // There are currently no SpielCodeErrors thrown by executeCodeBlock. As such, this is not tested.
    /* v8 ignore start */
    {
      if (error instanceof Error) {
        throw new SpielCodeError(`Execution of ${statement.functionName}() failed with ${error.message}`, 
            createStatementCodePosition(statement.statementOffset, 0));
      }
      throw error;
    }
    /* v8 ignore end */
  }
}
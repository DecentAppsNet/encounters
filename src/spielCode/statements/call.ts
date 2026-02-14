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
import FunctionBinding from "../types/FunctionBinding";

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
  const parameters = _parseParams(rawStatement.text, rawStatement.statementOffset);
  const statementOffset = rawStatement.statementOffset;
  return {statementType:StatementType.CALL, functionName, parameters, statementOffset};
}

export function executeCallStatement(statement:CallStatement, variables:VariableManager, functionBindings:FunctionBinding[]):void {
  const paramValues = statement.parameters.map(param => expressionToValue(param, variables));
  try {
    const functionBinding = functionBindings.find(binding => binding.functionName === statement.functionName);
    if (!functionBinding) throw new Error(`it did not match name of a bound function`);
    if (paramValues.length !== functionBinding.paramCount) throw new Error(`expected ${functionBinding.paramCount} parameters but got ${paramValues.length}.`);
    functionBinding.function(...paramValues);
  } catch(error) {
    if (error instanceof Error) {
      throw new SpielCodeError(`Execution of ${statement.functionName}() failed because ${error.message}`, 
          createStatementCodePosition(statement.statementOffset, 0));
    /* v8 ignore start */ // Nothing currently throws a non-Error.
    }
    throw error;
  } /* v8 ignore end */
}
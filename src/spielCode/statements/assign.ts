import AssignStatement from "../types/AssignStatement";
import StatementType from "../types/StatementType";
import {findVariableOrFunctionNameEnd} from "../statementUtil";
import {expressionToValue, textToExpression} from "../expressionUtil";
import VariableManager from "../VariableManager";
import Expression from "../types/Expression";
import RawStatement from "../types/RawStatement";
import SpielCodeError from "../types/SpielCodeError";
import {createStatementCodePosition} from "../codePositionUtil";

function _parseVariableName(statementText:string, statementOffset:number):string {
  const endPos = findVariableOrFunctionNameEnd(statementText);
  /* v8 ignore next */ // This is a good guard, but earlier code is currently preventing the condition that would be tested here.
  if (endPos === -1) throw new SpielCodeError(`Invalid variable name"`, createStatementCodePosition(statementOffset, 0));
  return statementText.slice(0, endPos);
}

function _parseValueExpression(statementText:string, statementOffset:number):Expression {
  const equalPos = statementText.indexOf('=');
  /* v8 ignore next */ // This is a good guard, but earlier code is currently preventing the condition that would be tested here.
  if (equalPos === -1) throw new SpielCodeError(`Missing "=" in assignment statement`, createStatementCodePosition(statementOffset, 0));
  const valueExpressionText = statementText.slice(equalPos + 1).trim();
  return textToExpression(valueExpressionText, statementOffset + equalPos + 1);
}

export function parseAssignStatement(rawStatement:RawStatement):AssignStatement {
  const variableName = _parseVariableName(rawStatement.text, rawStatement.statementOffset);
  const valueExpression = _parseValueExpression(rawStatement.text, rawStatement.statementOffset);
  const statementOffset = rawStatement.statementOffset;
  return {statementType:StatementType.ASSIGN, variableName, valueExpression, statementOffset};
}

export function executeAssignStatement(statement:AssignStatement, variables:VariableManager):void {
  const value = expressionToValue(statement.valueExpression, variables);
  variables.set(statement.variableName, value);
}
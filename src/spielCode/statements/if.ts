import RawStatement from "../types/RawStatement";
import IfStatement from "../types/IfStatement";
import {expressionToValue, textToExpression} from "../expressionUtil";
import Expression from "../types/Expression";
import StatementType from "../types/StatementType";
import {executeCodeBlock, rawStatementsToCodeBlock} from "../codeBlockUtil";
import VariableManager from "../VariableManager";
import SpielCodeError from "../types/SpielCodeError";
import {createStatementCodePosition} from "../codePositionUtil";
import FunctionBinding from "../types/FunctionBinding";

type StatementRange = { fromNo:number, toNo:number };

function _findContiguousStatementsBeneathDepth(statements:RawStatement[], fromNo:number, depth:number):StatementRange|null {
  if (fromNo >= statements.length || statements[fromNo].depth <= depth) return null;
  let toNo = fromNo+1;
  while(toNo < statements.length && statements[toNo].depth > depth) { ++toNo; }
  return { fromNo, toNo };
}

function _isElseIfStatement(statement:RawStatement):boolean {
  const words = statement.text.split(' ').map(word => word.trim()).filter(word => word.length);
  return words.length >= 2 && words[0] === 'else' && words[1] === 'if';
}

function _isElseStatement(statement:RawStatement):boolean {
  const words = statement.text.split(' ').map(word => word.trim()).filter(word => word.length);
  return words.length >= 1 && words[0] === 'else';
}

function _findElseIfStatements(statements:RawStatement[], startNo:number, startingDepth:number):StatementRange[] {
  const statementRanges:StatementRange[] = [];
  while(startNo < statements.length && statements[startNo].depth === startingDepth && _isElseIfStatement(statements[startNo])) {
    const thenRange = _findContiguousStatementsBeneathDepth(statements, startNo+1, startingDepth);
    if (thenRange === null) {
      throw new SpielCodeError(`Missing statement block for else if statement`, 
          createStatementCodePosition(statements[startNo].statementOffset,statements[startNo].text.length));
    }
    statementRanges.push({fromNo:thenRange.fromNo-1, toNo:thenRange.toNo});
    startNo = thenRange.toNo;
  }
  return statementRanges;
}

function _findElseStatements(statements:RawStatement[], startNo:number, startingDepth:number):StatementRange|null {
  if (startNo >= statements.length || statements[startNo].depth !== startingDepth || !_isElseStatement(statements[startNo])) return null;
  const elseRange = _findContiguousStatementsBeneathDepth(statements, startNo+1, startingDepth);
  if (elseRange === null) {
    throw new SpielCodeError(`Missing statement block for else statement`, 
        createStatementCodePosition(statements[startNo].statementOffset, statements[startNo].text.length));
  }
  return elseRange;
}

function _findStatementGroups(statements:RawStatement[], startNo:number):[thenStatements:StatementRange, elseIfStatements:StatementRange[], elseStatements:StatementRange|null] {
  const startingDepth = statements[startNo].depth;
  const thenStatements = _findContiguousStatementsBeneathDepth(statements, startNo+1, startingDepth);
  if (thenStatements === null) {
    throw new SpielCodeError(`Missing statement block for if statement`, createStatementCodePosition(statements[startNo].statementOffset, statements[startNo].text.length));
  }
  let nextStatementNo = thenStatements.toNo;
  const elseIfStatements:StatementRange[] = _findElseIfStatements(statements, nextStatementNo, startingDepth);
  if (elseIfStatements.length) nextStatementNo = elseIfStatements[elseIfStatements.length-1].toNo;
  const elseStatements = _findElseStatements(statements, nextStatementNo, startingDepth);
  
  return [thenStatements, elseIfStatements, elseStatements];
}

function _findExpression(statementText:string, statementOffset:number):Expression {
  const leftParenPos = statementText.indexOf('(');
  /* v8 ignore next */ // This is a good guard, but earlier code is currently preventing the condition that would be tested here.
  if (!leftParenPos) throw new SpielCodeError(`Missing "(" for if expression.`, createStatementCodePosition(statementOffset,0));
  const rightParenPos = statementText.lastIndexOf(')');
  /* v8 ignore next */ // This is a good guard, but earlier code is currently preventing the condition that would be tested here.
  if (!rightParenPos) throw new SpielCodeError(`Missing ")" for if expression.`, createStatementCodePosition(statementOffset,0));
  if (rightParenPos < leftParenPos) throw new SpielCodeError(`If expression is invalid"`, createStatementCodePosition(statementOffset,0));
  const expressionText = statementText.slice(leftParenPos + 1, rightParenPos).trim();
  if (!expressionText.length) throw new SpielCodeError(`Empty if expression`, createStatementCodePosition(statementOffset, leftParenPos));
  return textToExpression(expressionText, statementOffset);
}

function _findRawStatementCount(statement:IfStatement):number {
  const ifStatementCount = 1 + statement.thenCodeBlock.statements.length;
  const elseIfStatementCount = statement.elseIfs.reduce((total, elseIf) => total + 1 + elseIf.thenCodeBlock.statements.length, 0);
  const elseStatementCount = statement.elseCodeBlock ? 1 + statement.elseCodeBlock.statements.length : 0;
  return  ifStatementCount + elseIfStatementCount + elseStatementCount;
}

export function parseIfStatement(statements:RawStatement[], startNo:number):[statement:IfStatement, rawStatementCount:number] {
  const [thenStatements, elseIfStatements, elseStatements] = _findStatementGroups(statements, startNo);
  const expression = _findExpression(statements[startNo].text, statements[startNo].statementOffset);
  const thenCodeBlock = rawStatementsToCodeBlock(statements, thenStatements.fromNo);
  const elseIfs = elseIfStatements.map(elseIfStatements => ({
    expression:_findExpression(statements[elseIfStatements.fromNo].text, statements[elseIfStatements.fromNo].statementOffset), 
    thenCodeBlock:rawStatementsToCodeBlock(statements, elseIfStatements.fromNo+1)
  }));
  const elseCodeBlock = elseStatements ? rawStatementsToCodeBlock(statements, elseStatements.fromNo) : null;
  const statementOffset = statements[startNo].statementOffset;
  const statement:IfStatement = { statementType:StatementType.IF, expression, thenCodeBlock, elseIfs, elseCodeBlock, statementOffset };
  const rawStatementCount = _findRawStatementCount(statement);
  return [statement, rawStatementCount];
}

export function executeIfStatement(statement:IfStatement, variables:VariableManager, functionBindings:FunctionBinding[]):void {
  const value = expressionToValue(statement.expression, variables);
  if (value) {
    executeCodeBlock(statement.thenCodeBlock, variables, functionBindings);
    return;
  }
  for(let elseIfI = 0; elseIfI < statement.elseIfs.length; ++elseIfI) {
    const elseIf = statement.elseIfs[elseIfI];
    const elseIfValue = expressionToValue(elseIf.expression, variables);
    if (elseIfValue) {
      executeCodeBlock(elseIf.thenCodeBlock, variables, functionBindings);
      return;
    }
  }
  if (statement.elseCodeBlock) {
    executeCodeBlock(statement.elseCodeBlock, variables, functionBindings);
  }
}
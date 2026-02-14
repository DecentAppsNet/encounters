import CodeBlock from "./types/CodeBlock";
import RawStatement from "./types/RawStatement";
import {findStatementType} from "./statementUtil";
import StatementType from "./types/StatementType";
import {executeIfStatement, parseIfStatement} from './statements/if';
import {executeAssignStatement, parseAssignStatement} from "./statements/assign";
import Statement from "./types/Statement";
import {executeCallStatement, parseCallStatement} from "./statements/call";
import VariableManager from "./VariableManager";
import FunctionBinding from "./types/FunctionBinding";

function _rawToStatement(rawStatements:RawStatement[], startLineNo:number):[statement:Statement, skipCount:number] {
  const rawStatement = rawStatements[startLineNo];
  const statementType = findStatementType(rawStatement, rawStatement.statementOffset);
  switch(statementType) {
    case StatementType.IF:
      return parseIfStatement(rawStatements, startLineNo);
    case StatementType.ASSIGN:
      return [parseAssignStatement(rawStatement), 1];
    default: // StatementType.CALL
      return [parseCallStatement(rawStatement), 1];
  }
}

export function rawStatementsToCodeBlock(rawStatements:RawStatement[], startStatementNo:number):CodeBlock {
    const codeBlock:CodeBlock = {statements:[]};
    const startingDepth = rawStatements[startStatementNo].depth;
    let rawStatementNo = startStatementNo;
    while(rawStatementNo < rawStatements.length) {
        const rawStatement = rawStatements[rawStatementNo];
        if (rawStatement.depth < startingDepth) break;
        const [statement, skipCount] = _rawToStatement(rawStatements, rawStatementNo);
        /* v8 ignore next */ // This is a debug error, not a production error.
        if (skipCount < 1) throw Error('Unexpected'); // Replace infinite loop with an obvious debug error.
        rawStatementNo += skipCount;
        codeBlock.statements.push(statement);
    }
    return codeBlock;
}

export function executeCodeBlock(codeBlock:CodeBlock, variables:VariableManager, functionBindings:FunctionBinding[]):void {
  for(const statement of codeBlock.statements) {
    switch(statement.statementType) {
      case StatementType.IF:
        executeIfStatement(statement, variables, functionBindings);
        break;
      case StatementType.ASSIGN:
        executeAssignStatement(statement, variables);
        break;
      default: // StatementType.CALL
        executeCallStatement(statement, variables, functionBindings);
        break;
    }
  }
}
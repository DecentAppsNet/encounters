import Expression from "./Expression";
import CodeBlock from "./CodeBlock";
import StatementType from "./StatementType";

type ElseIf = {
  expression: Expression;
  thenCodeBlock: CodeBlock;
}

type IfStatement = {
  statementType: StatementType.IF;
  expression: Expression;
  thenCodeBlock: CodeBlock;
  elseIfs: ElseIf[];
  elseCodeBlock: CodeBlock|null;
  statementOffset:number;
}

export default IfStatement;
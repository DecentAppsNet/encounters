import Expression from "./Expression";
import StatementType from "./StatementType";

type AssignStatement = {
  statementType:StatementType.ASSIGN;
  variableName:string;
  valueExpression:Expression;
  statementOffset:number;
};

export default AssignStatement;
import Expression from "./Expression";
import StatementType from "./StatementType";

type CallStatement = {
    statementType:StatementType.CALL;
    functionName:string;
    parameters:Expression[];
    statementOffset:number;
};

export default CallStatement;
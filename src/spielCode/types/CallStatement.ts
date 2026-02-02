import Expression from "./Expression";
import StatementType from "./StatementType";

type CallStatement = {
    statementType:StatementType.CALL;
    functionName:string;
    function:Function;
    parameters:Expression[];
    statementOffset:number;
};

export default CallStatement;
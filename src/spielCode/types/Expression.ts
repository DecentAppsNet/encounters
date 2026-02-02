import {EvaluationFunction} from "../operations/operatorMap";

export enum ExpressionTokenType {
  OPERATOR,
  LITERAL,
  VARIABLE  
}

export type ExpressionToken = {
  tokenType: ExpressionTokenType;
  value: any;
  depth: number;
  operationNo: number|null;
};

/* What the types mean for leftToken and rightToken:
    * null means no operand
    * number refers to an earlier operation result that will be used as the operand.
    * ExpressionToken - a literal or variable value used as the operand. Treat this as mutable during evaluation of an expression.
 */
export type OperationBinding = {
  leftToken:ExpressionToken|number|null;
  rightToken:ExpressionToken|number|null;
  evaluationFunction:EvaluationFunction;
}

class Expression {
  private readonly _operationBindings: OperationBinding[];
  
  constructor(operationBindings: OperationBinding[]) {
    this._operationBindings = operationBindings;
  }
  
  // Returns a copy of the bindings suitable for use in evaluation. Remember that the token instances in each binding should be treated as immutable.
  getOperationBindings():OperationBinding[] { return [...this._operationBindings]; } 
}

export default Expression;
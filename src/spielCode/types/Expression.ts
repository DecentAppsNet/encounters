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

export function duplicateExpressionToken(from:ExpressionToken):ExpressionToken {
  return { tokenType: from.tokenType, value: from.value, depth: from.depth, operationNo: from.operationNo };
}

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

export function duplicateOperationBinding(from:OperationBinding):OperationBinding {
  const leftToken = from.leftToken === null || typeof from.leftToken === 'number' ? from.leftToken : duplicateExpressionToken(from.leftToken);
  const rightToken = from.rightToken === null || typeof from.rightToken === 'number' ? from.rightToken : duplicateExpressionToken(from.rightToken);
  return { leftToken, rightToken, evaluationFunction: from.evaluationFunction };
}

class Expression {
  private readonly _operationBindings: OperationBinding[];
  
  constructor(operationBindings: OperationBinding[]) {
    this._operationBindings = operationBindings;
  }
  
  // Returns a copy of the bindings suitable for use in evaluation.
  duplicateOperationBindings():OperationBinding[] { return this._operationBindings.map(duplicateOperationBinding); }
}

export default Expression;
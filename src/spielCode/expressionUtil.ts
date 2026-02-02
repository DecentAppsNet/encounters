import Expression, {ExpressionToken, ExpressionTokenType, OperationBinding} from "./types/Expression";
import {isWhitespace} from "../common/charUtil";
import VariableManager from "./VariableManager";
import {convertTokens, parseOperator} from "./operatorUtil";
import {TokenResult} from "./types/TokenResult";
import {
  isBooleanLiteral,
  isNumericLiteral,
  isStringLiteral,
  parseBooleanLiteral,
  parseNumericLiteral,
  parseStringLiteral
} from "./literalUtil";
import {isVariable, parseVariable, replaceVariableTokensWithLiterals} from "./variableUtil";
import SpielCodeError from "./types/SpielCodeError";
import {createStatementCodePosition} from "./codePositionUtil";
import {OPERATOR_MAP} from "./operations/operatorMap";
import {identity} from "./operations/identity";

function _parseNextToken(text:string, depth:number, startPos:number, sourceOffset:number):TokenResult|null {
  for(let i = startPos; i < text.length; ++i) {
    const c = text[i];
    if (isWhitespace(c)) continue;
    
    if (c === '(') { ++depth; continue; }
    else if (c === ')') { --depth; continue; }
    
    if (isBooleanLiteral(text, i)) return parseBooleanLiteral(text, depth, i, sourceOffset); // Must be called before _parseVariable() to avoid "true" / "false" being interpreted as variable names.
    if (isNumericLiteral(text, i)) return parseNumericLiteral(text, depth, i, sourceOffset);
    if (isStringLiteral(text, i)) return parseStringLiteral(text, depth, i, sourceOffset);
    
    return (isVariable(text, i)) ? parseVariable(text, depth, i, sourceOffset) : parseOperator(text, depth, i, sourceOffset);
  }
  return null;
}

function _checkForParenthesesMatch(text:string, sourceOffset:number):void {
  let depth = 0;
  for(let i = 0; i < text.length; ++i) {
    const c = text[i];
    if (c === '(') ++depth;
    else if (c === ')') --depth;
    if (depth < 0) throw new SpielCodeError('Right parenthesis without left parenthesis', createStatementCodePosition(sourceOffset, i));
  }
  if (depth > 0) throw new SpielCodeError( 'Expression is missing a closing parenthesis', createStatementCodePosition(sourceOffset, text.length));
}

function _lastTwoTokensAreVariables(tokens:ExpressionToken[]):boolean {
  return tokens.length > 1
    && tokens[tokens.length-1].tokenType === ExpressionTokenType.VARIABLE
    && tokens[tokens.length-2].tokenType === ExpressionTokenType.VARIABLE;
}

function _lastTwoTokensAreLiterals(tokens:ExpressionToken[]):boolean {
  return tokens.length > 1
    && tokens[tokens.length-1].tokenType === ExpressionTokenType.LITERAL
    && tokens[tokens.length-2].tokenType === ExpressionTokenType.LITERAL;
}

function _getSortedUniqueDepths(tokens:ExpressionToken[]):number[] {
  const depths:number[] = [];
  for(let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    if (!depths.includes(token.depth)) depths.push(token.depth);
  }
  depths.sort((a, b) => b - a);
  return depths;
}

function _getOperatorTokenNosAtDepth(tokens:ExpressionToken[], depth:number):number[] {
  // Get token#s for all the operator tokens at this depth. 
  const operatorTokenIndexes:number[] = [];
  for(let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    if (token.depth !== depth) continue;
    if (token.tokenType === ExpressionTokenType.OPERATOR) operatorTokenIndexes.push(i);
  }
  
  // Sort by order of operation.
  operatorTokenIndexes.sort((a, b) => {
    const tokenACode = tokens[a].value;
    const tokenBCode = tokens[b].value;
    const operationAOrder = OPERATOR_MAP[tokenACode].order;
    const operationBOrder = OPERATOR_MAP[tokenBCode].order;
    return operationAOrder - operationBOrder;
  });
  
  return operatorTokenIndexes;
}

function _findCascadedOperationNo(fromOperationNo:number, bindings:OperationBinding[]) {
  for(let i = 0; i < bindings.length; ++i) {
    const binding = bindings[i];
    if (binding.leftToken === fromOperationNo || binding.rightToken === fromOperationNo) {
      fromOperationNo = i;
      i = -1; // Search again from beginning for the new operation# to follow the "cascade".
    }
  }
  return fromOperationNo;
}

/*
  Updates an operation binding based on one of its two (left or right) operands.
  
  If that operand isn't bound to another operation already, the operand is claimed by this operation. And I set the 
  binding to that operand.
  
  If that operand is already bound to an operation, I bind that side to the result of the operation.
  
  The other wrinkle is cascading operations. Sometimes an operation needs the result of a non-adjacent operation, 
  because the adjacent operation depends on third operation completing first. For example:
  
  5 + 6 * 6 * 7
    #3  #1  #2
    
  #1: 6 * 6
  #2: #1 * 7  cascade: #2L <- #1
  #3: 5 + #2
  
  By traversing the bindings in order, I can find the cascaded operation#.
 */
function _updateOperationBinding(isLeftOperand:boolean, operandToken:ExpressionToken, nextOperationNo:number, nextBinding:OperationBinding, bindings:OperationBinding[]):void {
  const _bindOperand = (token:ExpressionToken, toOperationNo:number) => token.operationNo = toOperationNo;

  const _updateTokenBinding = (token:ExpressionToken|number) => {
    if (isLeftOperand) { nextBinding.leftToken = token; } else { nextBinding.rightToken = token; }
  }
  
  if (operandToken.operationNo !== null) {
    let fromOperationNo = _findCascadedOperationNo(operandToken.operationNo, bindings);
    _updateTokenBinding(fromOperationNo);
  } else {
    _updateTokenBinding(operandToken);
    _bindOperand(operandToken, nextOperationNo);
  }
}

function _addOperationBindingsAtDepth(tokens:ExpressionToken[], depth:number, operationBindings:OperationBinding[]) {
  const operatorTokenNos:number[] = _getOperatorTokenNosAtDepth(tokens, depth);
  for(let i = 0; i < operatorTokenNos.length; ++i) {
    const operatorTokenNo = operatorTokenNos[i];
    const operatorToken = tokens[operatorTokenNo];
    const operation = OPERATOR_MAP[operatorToken.value];
    const nextOperationNo = operationBindings.length;
    operatorToken.operationNo = nextOperationNo;
    
    const nextBinding:OperationBinding = { leftToken:null, rightToken:null, evaluationFunction:operation.evaluationFunction };
    if (operation.useLeft) _updateOperationBinding(true, tokens[operatorTokenNo-1], nextOperationNo, nextBinding, operationBindings);
    _updateOperationBinding(false, tokens[operatorTokenNo+1], nextOperationNo, nextBinding, operationBindings); // All supported operations use the right operand. Remove if(operation.useRight) check for code coverage.
    operationBindings.push(nextBinding);
  }
}

function _isUnaryRightToken(token:ExpressionToken):boolean {
  if (token.tokenType !== ExpressionTokenType.OPERATOR) return false;
  const operation = OPERATOR_MAP[token.value];
  return !operation.useLeft && operation.useRight; 
}

function _findNextUnaryRightSequence(tokens:ExpressionToken[], startTokenNo:number):[fromTokenNo:number, toTokenNo:number] {
  let fromTokenNo = -1;
  const startingDepth = tokens[startTokenNo].depth;
  for(let i = startTokenNo; i < tokens.length; ++i) {
    const token = tokens[i];
    if (_isUnaryRightToken(token) && token.depth === startingDepth) {
      if (fromTokenNo === -1) fromTokenNo = i;
    } else {
      if (fromTokenNo !== -1) {
        if (i - fromTokenNo > 1) return [fromTokenNo, i];
        fromTokenNo = -1;
      }
    }
  }
  return [-1,-1];
}

// This tweaks the depths such that a sequence of unary-right operators will be evaluated right-to-left instead of 
// left-to-right. An expression like "!-6" becomes "!(-6)" with the result of negating 6 in a first operation passed 
// to the second operation of !.
function _adjustDepthsForUnaryRightSequences(tokens:ExpressionToken[]) {
  let fromTokenNo = null, toTokenNo = 0;
  while(true) {
    [fromTokenNo, toTokenNo] = _findNextUnaryRightSequence(tokens, toTokenNo);
    if (fromTokenNo === -1) return;
    
    let bump = 0;
    for(let i = fromTokenNo; i < toTokenNo; ++i) {
      ++bump;
      tokens[i].depth += bump;
    }
    tokens[toTokenNo].depth += bump; // Operand should have same depth as preceding operator token.
  }
}

function _createOperationBindings(tokens:ExpressionToken[]):OperationBinding[] {
  if (tokens.length === 0) return [];
  if (tokens.length === 1) return [{leftToken:null, rightToken:tokens[0], evaluationFunction:identity}]; // Using "identity" operation avoids special-casing for a single token expression during eval.
  
  _adjustDepthsForUnaryRightSequences(tokens);
  
  const operationBindings:OperationBinding[] = [];
  const depths = _getSortedUniqueDepths(tokens);
  for(let i = 0; i < depths.length; ++i) {
    _addOperationBindingsAtDepth(tokens, depths[i], operationBindings);
  }
  return operationBindings;
}

export function textToExpression(text:string, sourceOffset:number):Expression {
    const tokens:ExpressionToken[] = [];
    
    _checkForParenthesesMatch(text, sourceOffset);
    
    let pos = 0;
    let tokenResult:TokenResult|null = null;
    let depth = 0;
    do {
      tokenResult = _parseNextToken(text, depth, pos, sourceOffset);
      if (tokenResult) {
        tokens.push(tokenResult.token);
        if (_lastTwoTokensAreVariables(tokens)) throw new SpielCodeError('Two variables cannot be next to each other', createStatementCodePosition(sourceOffset, pos));
        if (_lastTwoTokensAreLiterals(tokens)) throw new SpielCodeError('Two literals cannot be next to each other', createStatementCodePosition(sourceOffset, pos));
        pos = tokenResult.endPos;
        depth = tokenResult.token.depth;
      }
    } while(tokenResult);
    
    convertTokens(tokens);
    const operationBindings = _createOperationBindings(tokens);
    return new Expression(operationBindings);
}

function _toTokenValueOrNull(maybeAToken:ExpressionToken|number|null):ExpressionToken|null {
  return maybeAToken === null ? null : (maybeAToken as ExpressionToken).value;
}

function _findDepthFromBinding(operationBinding:OperationBinding):number {
  if (operationBinding.leftToken === null || typeof operationBinding.leftToken === 'number') {
    return (operationBinding.rightToken as ExpressionToken).depth;
  } else {
    return operationBinding.leftToken.depth;
  }
}

export function expressionToValue(expression:Expression, variableManager:VariableManager):any {
  const operationBindings = expression.getOperationBindings();
  
  replaceVariableTokensWithLiterals(operationBindings, variableManager);
  
  for(let operationNo = 0; operationNo < operationBindings.length; ++operationNo) {
    const operationBinding = operationBindings[operationNo];
    const { leftToken, rightToken, evaluationFunction } = operationBinding;
    const leftOperand = _toTokenValueOrNull(leftToken);
    const rightOperand = _toTokenValueOrNull(rightToken);
    const value = evaluationFunction(leftOperand, rightOperand);
    if (operationNo === operationBindings.length-1) return value;
    
    const depth = _findDepthFromBinding(operationBinding);
    for(let futureOperationNo = operationNo+1; futureOperationNo < operationBindings.length; ++futureOperationNo) {
      const futureBinding = operationBindings[futureOperationNo];
      if (futureBinding.leftToken === operationNo) {
        futureBinding.leftToken = {tokenType:ExpressionTokenType.LITERAL, value, depth, operationNo:futureOperationNo}; 
        break; 
      }
      if (futureBinding.rightToken === operationNo) { 
        futureBinding.rightToken = {tokenType:ExpressionTokenType.LITERAL, value, depth, operationNo:futureOperationNo}; 
        break; 
      }
    }
  }
  
  return undefined; // An empty expression with no tokens.
}
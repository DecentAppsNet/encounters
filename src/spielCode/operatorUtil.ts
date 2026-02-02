import {ExpressionToken, ExpressionTokenType} from "./types/Expression";
import {TokenResult} from "./types/TokenResult";
import {OPERATOR_CHARS, OPERATOR_SYMBOLS, OPERATOR_MAP} from "./operations/operatorMap";
import SpielCodeError from "./types/SpielCodeError";
import {createStatementCodePosition} from "./codePositionUtil";

export function parseOperator(text:string, depth:number, startPos:number, sourceOffset:number):TokenResult {
  let check3 = '';
  for(let i = startPos; i < startPos + 3 && i < text.length; ++i) {
    const c = text[i];
    if (!OPERATOR_CHARS[c]) break;
    check3 += c;
  }
  if (OPERATOR_SYMBOLS.includes(check3)) return { token: { tokenType: ExpressionTokenType.OPERATOR, value: check3, depth, operationNo:null }, endPos: startPos + check3.length };
  
  // Sometimes two operators are typed together, e.g. "5*-3" would have check3 equal to "*-". Look for a match with a smaller number of characters.
  let shorterCheck = check3;
  while(shorterCheck.length > 0) {
    shorterCheck = check3.slice(0, shorterCheck.length - 1);
    /* v8 ignore next */ // With the current operator set, conditional below will always be true. But I'm leaving the conditional to avoid coupling the logic to the operator set.
    if (OPERATOR_SYMBOLS.includes(shorterCheck)) {
      return { 
        token: { tokenType: ExpressionTokenType.OPERATOR, value: shorterCheck, depth, operationNo:null }, 
        endPos: startPos + shorterCheck.length 
      }
    }
  }
  
  throw new SpielCodeError(`Invalid operator: "${check3}"`, createStatementCodePosition(sourceOffset, startPos));
}

export function convertTokens(tokens:ExpressionToken[]):void {
  for(let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    if (token.tokenType !== ExpressionTokenType.OPERATOR) continue;
    const operator = OPERATOR_MAP[tokens[i].value];
    if (operator && operator.convertTokenFunction) operator.convertTokenFunction(tokens, i);
  }
}
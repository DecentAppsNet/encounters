import RawStatement from "./types/RawStatement";
import {isWhitespace} from "../common/charUtil";
import SpielCodeError from "./types/SpielCodeError";
import {createStatementCodePosition} from "./codePositionUtil";

function _findWhitespacePrefixLength(text:string):number {
  let i = 0;
  while(i < text.length && isWhitespace(text[i])) { ++i; }
  return i;
}

export function textToRawStatements(text:string):RawStatement[] {
  let rawStatements:RawStatement[] = [];
  let depth = 0;
  let chars = '';
  let statementOffset = 0;
  for(let i = 0; i < text.length; ++i) {
    const c = text[i];
    if (c === '{' || c === '}' || c === ';') {
      statementOffset += _findWhitespacePrefixLength(chars);
      rawStatements.push({ text:chars.trim(), depth, statementOffset});
      chars = '';
      statementOffset = i + 1;
      if (c === '{') { ++depth; }
      else if (c === '}') { 
        --depth;
        if (depth < 0) throw new SpielCodeError(`Unexpected "}"`, createStatementCodePosition(i, 0));
      }
      continue;
    }
    chars += c;
  }
  if (depth !== 0) throw new SpielCodeError(`Missing "}"`, createStatementCodePosition(text.length, 0));
  if (chars.length > 0) {
    statementOffset += _findWhitespacePrefixLength(chars);
    rawStatements.push({ text:chars.trim(), depth, statementOffset}); 
  }
  rawStatements = rawStatements.filter(line => line.text.length > 0);
  return rawStatements;
}
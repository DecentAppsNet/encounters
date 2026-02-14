import CodePosition, {UNKNOWN_POSITION} from "./types/CodePosition";

export function createStatementCodePosition(statementOffset:number, offset:number):CodePosition {
  return {lineNo:UNKNOWN_POSITION, charNo:statementOffset+offset};
}

export function createCodePositionFromSourceAndOffset(source:string, offset:number):CodePosition {
  let seek = 0, lineNo = 0, charNo = 0;
  while (seek < offset) {
    if (source[seek] === '\n') {
      ++lineNo;
      charNo = 0;
    } else {
      ++charNo;
    }
    ++seek;
  }
  return {lineNo, charNo};
}
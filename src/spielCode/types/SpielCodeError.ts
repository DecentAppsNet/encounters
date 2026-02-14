import CodePosition, { UNKNOWN_POSITION } from "./CodePosition";

class SpielCodeError extends Error {
  public codePosition:CodePosition;
  
  constructor(message:string, codePosition?:CodePosition, charOffset?:number) {
    if (!codePosition) codePosition = {lineNo: UNKNOWN_POSITION, charNo: UNKNOWN_POSITION};
    
    const charNo = charOffset === undefined 
      ? codePosition.charNo
      : codePosition.charNo === UNKNOWN_POSITION 
        ? charOffset
        : codePosition.charNo + charOffset;
    
    const lineText = codePosition.lineNo === UNKNOWN_POSITION ? '' : ` line ${codePosition.lineNo}`;
    const charText = charNo === UNKNOWN_POSITION ? '' : ` char ${charNo}`;
    const atText = lineText || charText ? ' at' : '';
    
    const combinedMessage = `${message}${atText}${lineText}${charText}`;
    super(combinedMessage);
    
    Object.setPrototypeOf(this, SpielCodeError.prototype);
    
    this.codePosition = codePosition;
  }
}

export default SpielCodeError;
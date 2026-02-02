import CodePosition, { UNKNOWN_POSITION } from "./CodePosition";

class SpielCodeError extends Error {
  public codePosition:CodePosition;
  
  constructor(message:string, codePosition?:CodePosition, charOffset?:number) {
    if (!codePosition) codePosition = {nodeNo: UNKNOWN_POSITION, lineNo: UNKNOWN_POSITION, charNo: UNKNOWN_POSITION};
    
    const charNo = charOffset === undefined 
      ? codePosition.charNo
      : codePosition.charNo === UNKNOWN_POSITION 
        ? charOffset
        : codePosition.charNo + charOffset;
    
    const nodeText = codePosition.nodeNo === UNKNOWN_POSITION ? '' : ` node ${codePosition.nodeNo}`;
    const lineText = codePosition.lineNo === UNKNOWN_POSITION ? '' : ` line ${codePosition.lineNo}`;
    const charText = charNo === UNKNOWN_POSITION ? '' : ` char ${charNo}`;
    const atText = nodeText || lineText || charText ? ' at' : '';
    
    const combinedMessage = `${message}${atText}${nodeText}${lineText}${charText}`;
    super(combinedMessage);
    
    Object.setPrototypeOf(this, SpielCodeError.prototype);
    
    this.codePosition = codePosition;
  }
}

export default SpielCodeError;
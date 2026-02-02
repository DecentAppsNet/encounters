// An intermediate type used for parsing source code text into a CodeBlock.
type RawStatement = {
  text:string;
  depth:number;
  statementOffset:number;
}

export default RawStatement;
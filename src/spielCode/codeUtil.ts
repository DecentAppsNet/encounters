import Code from "./types/Code";
import {executeCodeBlock, rawStatementsToCodeBlock} from "./codeBlockUtil";
import VariableManager from "./VariableManager";
import {textToRawStatements} from "./rawStatementUtil";
import SpielCodeError from "./types/SpielCodeError";
import {createCodePositionFromSourceAndOffset} from "./codePositionUtil";
import {UNKNOWN_POSITION} from "./types/CodePosition";

export function textToCode(text:string, nodeNo:number = UNKNOWN_POSITION):Code {
    try {
        const rawStatements = textToRawStatements(text);
        const rootCodeBlock = rawStatementsToCodeBlock(rawStatements, 0);
        return { rootCodeBlock, source:text };
    } catch (error) {
        /* v8 ignore next */ // It's a debug error for the thrown error to not be a SpielCodeError.
        if (error instanceof SpielCodeError) error.codePosition = createCodePositionFromSourceAndOffset(text, error.codePosition.charNo, nodeNo);
        throw error;
    }
}

export function executeCode(code:Code, variables:VariableManager, nodeNo:number = UNKNOWN_POSITION):void {
    try {
        executeCodeBlock(code.rootCodeBlock, variables);
    } catch (error) {
        // There are currently no SpielCodeErrors thrown by executeCodeBlock. As such, this is not tested.
        /* v8 ignore start */
        {
            if (error instanceof SpielCodeError) error.codePosition = createCodePositionFromSourceAndOffset(code.source, error.codePosition.charNo, nodeNo);
            throw error;
        }
        /* v8 ignore end */
    }
}
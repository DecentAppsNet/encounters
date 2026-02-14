import Code from "./types/Code";
import {executeCodeBlock, rawStatementsToCodeBlock} from "./codeBlockUtil";
import VariableManager from "./VariableManager";
import {textToRawStatements} from "./rawStatementUtil";
import SpielCodeError from "./types/SpielCodeError";
import {createCodePositionFromSourceAndOffset} from "./codePositionUtil";
import FunctionBinding from "./types/FunctionBinding";

export function textToCode(text:string):Code {
    try {
        const rawStatements = textToRawStatements(text);
        const rootCodeBlock = rawStatementsToCodeBlock(rawStatements, 0);
        return { rootCodeBlock, source:text };
    } catch (error) {
        /* v8 ignore next */ // It's a debug error for the thrown error to not be a SpielCodeError.
        if (error instanceof SpielCodeError) error.codePosition = createCodePositionFromSourceAndOffset(text, error.codePosition.charNo);
        throw error;
    }
}

export function executeCode(code:Code, variables:VariableManager, functionBindings:FunctionBinding[] = []):void {
    try {
        executeCodeBlock(code.rootCodeBlock, variables, functionBindings);
    } catch (error) {
        // There are currently no SpielCodeErrors thrown by executeCodeBlock. As such, this is not tested.
        /* v8 ignore start */
        {
            if (error instanceof SpielCodeError) error.codePosition = createCodePositionFromSourceAndOffset(code.source, error.codePosition.charNo);
            throw error;
        }
        /* v8 ignore end */
    }
}
import { ErrorListener as ANTLRErrorListener } from "antlr4";
declare class ErrorListener extends ANTLRErrorListener<any> {
    private _errors;
    constructor();
    syntaxError(recognizer: any, offendingSymbol: any, line: number, column: number, message: string): void;
    getErrors(): any[];
    hasErrors(): boolean;
}
export default ErrorListener;

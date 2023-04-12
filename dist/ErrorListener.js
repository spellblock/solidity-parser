import { ErrorListener as ANTLRErrorListener } from "antlr4";
class ErrorListener extends ANTLRErrorListener {
    constructor() {
        super();
        this._errors = [];
    }
    syntaxError(recognizer, offendingSymbol, line, column, message) {
        this._errors.push({ message, line, column });
    }
    getErrors() {
        return this._errors;
    }
    hasErrors() {
        return this._errors.length > 0;
    }
}
export default ErrorListener;

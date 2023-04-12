import { ErrorListener as ANTLRErrorListener } from "antlr4";

class ErrorListener extends ANTLRErrorListener<any> {
  private _errors: any[];

  constructor() {
    super();

    this._errors = [];
  }

  syntaxError(
    recognizer: any,
    offendingSymbol: any,
    line: number,
    column: number,
    message: string
  ) {
    this._errors.push({ message, line, column });
  }

  getErrors(): any[] {
    return this._errors;
  }

  hasErrors() {
    return this._errors.length > 0;
  }
}

export default ErrorListener;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const antlr4_1 = require("antlr4");
class ErrorListener extends antlr4_1.ErrorListener {
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
exports.default = ErrorListener;

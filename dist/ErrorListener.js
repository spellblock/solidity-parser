"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("antlr4/index"));
class ErrorListener extends index_1.default.error.ErrorListener {
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

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visit = exports.parse = exports.tokenize = exports.ParserError = void 0;
const antlr4ts_1 = require("antlr4ts");
const SolidityLexer_1 = require("./antlr/SolidityLexer");
const SolidityParser_1 = require("./antlr/SolidityParser");
const ast_types_1 = require("./ast-types");
const ASTBuilder_1 = require("./ASTBuilder");
const ErrorListener_1 = __importDefault(require("./ErrorListener"));
const tokens_1 = require("./tokens");
class ParserError extends Error {
    constructor(args) {
        super();
        const { message, line, column } = args.errors[0];
        this.message = `${message} (${line}:${column})`;
        this.errors = args.errors;
        if (Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(this, this.constructor);
        }
        else {
            this.stack = new Error().stack;
        }
    }
}
exports.ParserError = ParserError;
function tokenize(input, options = {}) {
    const inputStream = new antlr4ts_1.ANTLRInputStream(input);
    const lexer = new SolidityLexer_1.SolidityLexer(inputStream);
    return tokens_1.buildTokenList(lexer.getAllTokens(), options);
}
exports.tokenize = tokenize;
function parse(input, options = {}) {
    const inputStream = new antlr4ts_1.ANTLRInputStream(input);
    const lexer = new SolidityLexer_1.SolidityLexer(inputStream);
    const tokenStream = new antlr4ts_1.CommonTokenStream(lexer);
    const parser = new SolidityParser_1.SolidityParser(tokenStream);
    const listener = new ErrorListener_1.default();
    lexer.removeErrorListeners();
    lexer.addErrorListener(listener);
    parser.removeErrorListeners();
    parser.addErrorListener(listener);
    parser.buildParseTree = true;
    const sourceUnit = parser.sourceUnit();
    const astBuilder = new ASTBuilder_1.ASTBuilder(options);
    astBuilder.visit(sourceUnit);
    const ast = astBuilder.result;
    if (ast === null) {
        throw new Error('ast should never be null');
    }
    let tokenList = [];
    if (options.tokens === true) {
        tokenList = tokens_1.buildTokenList(tokenStream.getTokens(), options);
    }
    if (options.tolerant !== true && listener.hasErrors()) {
        throw new ParserError({ errors: listener.getErrors() });
    }
    if (options.tolerant === true && listener.hasErrors()) {
        ast.errors = listener.getErrors();
    }
    if (options.tokens === true) {
        ast.tokens = tokenList;
    }
    return ast;
}
exports.parse = parse;
function _isASTNode(node) {
    if (typeof node !== 'object' || node === null) {
        return false;
    }
    const nodeAsAny = node;
    if (Object.prototype.hasOwnProperty.call(nodeAsAny, 'type') && typeof nodeAsAny.type === "string") {
        return ast_types_1.astNodeTypes.includes(nodeAsAny.type);
    }
    return false;
}
function visit(node, visitor, nodeParent) {
    if (Array.isArray(node)) {
        node.forEach((child) => visit(child, visitor, nodeParent));
    }
    if (!_isASTNode(node))
        return;
    let cont = true;
    if (visitor[node.type] !== undefined) {
        // TODO can we avoid this `as any`
        cont = visitor[node.type](node, nodeParent);
    }
    if (cont === false)
        return;
    for (const prop in node) {
        if (Object.prototype.hasOwnProperty.call(node, prop)) {
            // TODO can we avoid this `as any`
            visit(node[prop], visitor, node);
        }
    }
    const selector = (node.type + ':exit');
    if (visitor[selector] !== undefined) {
        // TODO can we avoid this `as any`
        visitor[selector](node, nodeParent);
    }
}
exports.visit = visit;

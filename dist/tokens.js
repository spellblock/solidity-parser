"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTokenList = void 0;
const tokens_string_1 = __importDefault(require("./tokens-string"));
const tokens = tokens_string_1.default;
const TYPE_TOKENS = [
    'var',
    'bool',
    'address',
    'string',
    'Int',
    'Uint',
    'Byte',
    'Fixed',
    'UFixed',
];
function rsplit(str, value) {
    const index = str.lastIndexOf(value);
    return [str.substring(0, index), str.substring(index + 1, str.length)];
}
function normalizeTokenType(value) {
    if (value.endsWith("'")) {
        value = value.substring(0, value.length - 1);
    }
    if (value.startsWith("'")) {
        value = value.substring(1, value.length);
    }
    return value;
}
function getTokenType(value) {
    if (value === 'Identifier' || value === 'from') {
        return 'Identifier';
    }
    else if (value === 'TrueLiteral' || value === 'FalseLiteral') {
        return 'Boolean';
    }
    else if (value === 'VersionLiteral') {
        return 'Version';
    }
    else if (value === 'StringLiteral') {
        return 'String';
    }
    else if (TYPE_TOKENS.includes(value)) {
        return 'Type';
    }
    else if (value === 'NumberUnit') {
        return 'Subdenomination';
    }
    else if (value === 'DecimalNumber') {
        return 'Numeric';
    }
    else if (value === 'HexLiteral') {
        return 'Hex';
    }
    else if (value === 'ReservedKeyword') {
        return 'Reserved';
    }
    else if (/^\W+$/.test(value)) {
        return 'Punctuator';
    }
    else {
        return 'Keyword';
    }
}
function getTokenTypeMap() {
    return tokens
        .split('\n')
        .map((line) => rsplit(line, '='))
        .reduce((acum, [value, key]) => {
        acum[parseInt(key, 10)] = normalizeTokenType(value);
        return acum;
    }, {});
}
function buildTokenList(tokensArg, options) {
    const tokenTypes = getTokenTypeMap();
    const result = tokensArg.map((token) => {
        var _a, _b;
        const type = getTokenType(tokenTypes[token.type]);
        const node = { type, value: token.text };
        if (options.range === true) {
            node.range = [token.startIndex, token.stopIndex + 1];
        }
        if (options.loc === true) {
            node.loc = {
                start: { line: token.line, column: token.charPositionInLine },
                end: { line: token.line, column: token.charPositionInLine + ((_b = (_a = token.text) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) },
            };
        }
        return node;
    });
    return result;
}
exports.buildTokenList = buildTokenList;

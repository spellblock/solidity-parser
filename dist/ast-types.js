"use strict";
// Base on the original type definitions for solidity-parser-antlr 0.2
// by Leonid Logvinov <https://github.com/LogvinovLeon>
//    Alex Browne <https://github.com/albrow>
//    Xiao Liang <https://github.com/yxliang01>
Object.defineProperty(exports, "__esModule", { value: true });
exports.unaryOpValues = exports.binaryOpValues = exports.astNodeTypes = void 0;
exports.astNodeTypes = [
    'SourceUnit',
    'PragmaDirective',
    'ImportDirective',
    'ContractDefinition',
    'InheritanceSpecifier',
    'StateVariableDeclaration',
    'UsingForDeclaration',
    'StructDefinition',
    'ModifierDefinition',
    'ModifierInvocation',
    'FunctionDefinition',
    'EventDefinition',
    'CustomErrorDefinition',
    'RevertStatement',
    'EnumValue',
    'EnumDefinition',
    'VariableDeclaration',
    'UserDefinedTypeName',
    'Mapping',
    'ArrayTypeName',
    'FunctionTypeName',
    'Block',
    'ExpressionStatement',
    'IfStatement',
    'WhileStatement',
    'ForStatement',
    'InlineAssemblyStatement',
    'DoWhileStatement',
    'ContinueStatement',
    'Break',
    'Continue',
    'BreakStatement',
    'ReturnStatement',
    'EmitStatement',
    'ThrowStatement',
    'VariableDeclarationStatement',
    'ElementaryTypeName',
    'FunctionCall',
    'AssemblyBlock',
    'AssemblyCall',
    'AssemblyLocalDefinition',
    'AssemblyAssignment',
    'AssemblyStackAssignment',
    'LabelDefinition',
    'AssemblySwitch',
    'AssemblyCase',
    'AssemblyFunctionDefinition',
    'AssemblyFor',
    'AssemblyIf',
    'TupleExpression',
    'NameValueExpression',
    'BooleanLiteral',
    'NumberLiteral',
    'Identifier',
    'BinaryOperation',
    'UnaryOperation',
    'NewExpression',
    'Conditional',
    'StringLiteral',
    'HexLiteral',
    'HexNumber',
    'DecimalNumber',
    'MemberAccess',
    'IndexAccess',
    'IndexRangeAccess',
    'NameValueList',
    'UncheckedStatement',
    'TryStatement',
    'CatchClause',
    'FileLevelConstant',
    'AssemblyMemberAccess',
    'TypeDefinition'
];
exports.binaryOpValues = [
    '+',
    '-',
    '*',
    '/',
    '**',
    '%',
    '<<',
    '>>',
    '&&',
    '||',
    ',,',
    '&',
    ',',
    '^',
    '<',
    '>',
    '<=',
    '>=',
    '==',
    '!=',
    '=',
    ',=',
    '^=',
    '&=',
    '<<=',
    '>>=',
    '+=',
    '-=',
    '*=',
    '/=',
    '%=',
    '|',
    '|=',
];
exports.unaryOpValues = [
    '-',
    '+',
    '++',
    '--',
    '~',
    'after',
    'delete',
    '!',
];
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This monstrosity is here to check that there are no ASTNodeTypeString without
 * a corresponding ASTNode, no ASTNode without a corresponding ASTNodeTypeString,
 * no ASTVisitorEnter callback without a corresponding ASTNode,
 * no ASTVisitorExit callback without a corresponding ASTVisitorEnter callback,
 * and so on, and so on.
 *
 * There are probably some ways to simplify this by deriving some types
 * from others.
 */
function checkTypes() {
    const astNodeType = '';
    const astNodeTypeString = '';
    const astVisitorEnterKey = '';
    let assignAstNodeType = astNodeTypeString;
    assignAstNodeType = astVisitorEnterKey;
    let assignAstNodeTyeString = astNodeType;
    assignAstNodeTyeString = astVisitorEnterKey;
    let assignAstVisitorEnterKey = astNodeType;
    assignAstVisitorEnterKey = astNodeTypeString;
    const astNodeTypeExit = '';
    const astNodeTypeStringExit = '';
    const astVisitorEnterKeyExit = '';
    const astVisitorExitKey = '';
    let letAstNodeTypeExit = astNodeTypeStringExit;
    letAstNodeTypeExit = astVisitorEnterKeyExit;
    letAstNodeTypeExit = astVisitorExitKey;
    let assignAstNodeTypeStringExit = astNodeTypeExit;
    assignAstNodeTypeStringExit = astVisitorEnterKeyExit;
    assignAstNodeTypeStringExit = astVisitorExitKey;
    let assignAstVisitorEnterKeyExit = astNodeTypeExit;
    assignAstVisitorEnterKeyExit = astNodeTypeStringExit;
    assignAstVisitorEnterKeyExit = astVisitorExitKey;
    let assignAstVisitorExitKey = astNodeTypeExit;
    assignAstVisitorExitKey = astNodeTypeStringExit;
    assignAstVisitorExitKey = astVisitorEnterKeyExit;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

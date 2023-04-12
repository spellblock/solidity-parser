import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import * as SP from './antlr/SolidityParser';
import * as AST from './ast-types';
import { ErrorNode } from 'antlr4ts/tree/ErrorNode';
export class ASTBuilder extends AbstractParseTreeVisitor {
    constructor(options) {
        super();
        this.options = options;
        this.result = null;
    }
    defaultResult() {
        throw new Error('Unknown node');
    }
    aggregateResult() {
        return { type: '' };
    }
    visitSourceUnit(ctx) {
        var _a;
        const children = ((_a = ctx.children) !== null && _a !== void 0 ? _a : []).filter((x) => !(x instanceof ErrorNode));
        const node = {
            type: 'SourceUnit',
            children: children.slice(0, -1).map((child) => this.visit(child)),
        };
        const result = this._addMeta(node, ctx);
        this.result = result;
        return result;
    }
    visitContractPart(ctx) {
        return this.visit(ctx.getChild(0));
    }
    visitContractDefinition(ctx) {
        const name = this._toText(ctx.identifier());
        const kind = this._toText(ctx.getChild(0));
        this._currentContract = name;
        const node = {
            type: 'ContractDefinition',
            name,
            baseContracts: ctx
                .inheritanceSpecifier()
                .map((x) => this.visitInheritanceSpecifier(x)),
            subNodes: ctx.contractPart().map((x) => this.visit(x)),
            kind,
        };
        return this._addMeta(node, ctx);
    }
    visitStateVariableDeclaration(ctx) {
        const type = this.visitTypeName(ctx.typeName());
        const iden = ctx.identifier();
        const name = this._toText(iden);
        let expression = null;
        const ctxExpression = ctx.expression();
        if (ctxExpression) {
            expression = this.visitExpression(ctxExpression);
        }
        let visibility = 'default';
        if (ctx.InternalKeyword().length > 0) {
            visibility = 'internal';
        }
        else if (ctx.PublicKeyword().length > 0) {
            visibility = 'public';
        }
        else if (ctx.PrivateKeyword().length > 0) {
            visibility = 'private';
        }
        let isDeclaredConst = false;
        if (ctx.ConstantKeyword().length > 0) {
            isDeclaredConst = true;
        }
        let override;
        const overrideSpecifier = ctx.overrideSpecifier();
        if (overrideSpecifier.length === 0) {
            override = null;
        }
        else {
            override = overrideSpecifier[0]
                .userDefinedTypeName()
                .map((x) => this.visitUserDefinedTypeName(x));
        }
        let isImmutable = false;
        if (ctx.ImmutableKeyword().length > 0) {
            isImmutable = true;
        }
        const decl = {
            type: 'VariableDeclaration',
            typeName: type,
            name,
            identifier: this.visitIdentifier(iden),
            expression,
            visibility,
            isStateVar: true,
            isDeclaredConst,
            isIndexed: false,
            isImmutable,
            override,
            storageLocation: null,
        };
        const node = {
            type: 'StateVariableDeclaration',
            variables: [this._addMeta(decl, ctx)],
            initialValue: expression,
        };
        return this._addMeta(node, ctx);
    }
    visitVariableDeclaration(ctx) {
        let storageLocation = null;
        const ctxStorageLocation = ctx.storageLocation();
        if (ctxStorageLocation) {
            storageLocation = this._toText(ctxStorageLocation);
        }
        const identifierCtx = ctx.identifier();
        const node = {
            type: 'VariableDeclaration',
            typeName: this.visitTypeName(ctx.typeName()),
            name: this._toText(identifierCtx),
            identifier: this.visitIdentifier(identifierCtx),
            storageLocation,
            isStateVar: false,
            isIndexed: false,
            expression: null,
        };
        return this._addMeta(node, ctx);
    }
    visitVariableDeclarationStatement(ctx) {
        let variables = [];
        const ctxVariableDeclaration = ctx.variableDeclaration();
        const ctxIdentifierList = ctx.identifierList();
        const ctxVariableDeclarationList = ctx.variableDeclarationList();
        if (ctxVariableDeclaration !== undefined) {
            variables = [this.visitVariableDeclaration(ctxVariableDeclaration)];
        }
        else if (ctxIdentifierList !== undefined) {
            variables = this.buildIdentifierList(ctxIdentifierList);
        }
        else if (ctxVariableDeclarationList) {
            variables = this.buildVariableDeclarationList(ctxVariableDeclarationList);
        }
        let initialValue = null;
        const ctxExpression = ctx.expression();
        if (ctxExpression) {
            initialValue = this.visitExpression(ctxExpression);
        }
        const node = {
            type: 'VariableDeclarationStatement',
            variables,
            initialValue,
        };
        return this._addMeta(node, ctx);
    }
    visitStatement(ctx) {
        return this.visit(ctx.getChild(0));
    }
    visitSimpleStatement(ctx) {
        return this.visit(ctx.getChild(0));
    }
    visitEventDefinition(ctx) {
        const parameters = ctx
            .eventParameterList()
            .eventParameter()
            .map((paramCtx) => {
            const type = this.visitTypeName(paramCtx.typeName());
            let name = null;
            const paramCtxIdentifier = paramCtx.identifier();
            if (paramCtxIdentifier) {
                name = this._toText(paramCtxIdentifier);
            }
            const node = {
                type: 'VariableDeclaration',
                typeName: type,
                name,
                identifier: paramCtxIdentifier !== undefined
                    ? this.visitIdentifier(paramCtxIdentifier)
                    : null,
                isStateVar: false,
                isIndexed: paramCtx.IndexedKeyword() !== undefined,
                storageLocation: null,
                expression: null,
            };
            return this._addMeta(node, paramCtx);
        });
        const node = {
            type: 'EventDefinition',
            name: this._toText(ctx.identifier()),
            parameters,
            isAnonymous: ctx.AnonymousKeyword() !== undefined,
        };
        return this._addMeta(node, ctx);
    }
    visitBlock(ctx) {
        const node = {
            type: 'Block',
            statements: ctx.statement().map((x) => this.visitStatement(x)),
        };
        return this._addMeta(node, ctx);
    }
    visitParameter(ctx) {
        let storageLocation = null;
        const ctxStorageLocation = ctx.storageLocation();
        if (ctxStorageLocation !== undefined) {
            storageLocation = this._toText(ctxStorageLocation);
        }
        let name = null;
        const ctxIdentifier = ctx.identifier();
        if (ctxIdentifier !== undefined) {
            name = this._toText(ctxIdentifier);
        }
        const node = {
            type: 'VariableDeclaration',
            typeName: this.visitTypeName(ctx.typeName()),
            name,
            identifier: ctxIdentifier !== undefined
                ? this.visitIdentifier(ctxIdentifier)
                : null,
            storageLocation,
            isStateVar: false,
            isIndexed: false,
            expression: null,
        };
        return this._addMeta(node, ctx);
    }
    visitFunctionDefinition(ctx) {
        let isConstructor = false;
        let isFallback = false;
        let isReceiveEther = false;
        let isVirtual = false;
        let name = null;
        let parameters = [];
        let returnParameters = null;
        let visibility = 'default';
        let block = null;
        const ctxBlock = ctx.block();
        if (ctxBlock !== undefined) {
            block = this.visitBlock(ctxBlock);
        }
        const modifiers = ctx
            .modifierList()
            .modifierInvocation()
            .map((mod) => this.visitModifierInvocation(mod));
        let stateMutability = null;
        if (ctx.modifierList().stateMutability().length > 0) {
            stateMutability = this._stateMutabilityToText(ctx.modifierList().stateMutability(0));
        }
        // see what type of function we're dealing with
        const ctxReturnParameters = ctx.returnParameters();
        switch (this._toText(ctx.functionDescriptor().getChild(0))) {
            case 'constructor':
                parameters = ctx
                    .parameterList()
                    .parameter()
                    .map((x) => this.visit(x));
                // error out on incorrect function visibility
                if (ctx.modifierList().InternalKeyword().length > 0) {
                    visibility = 'internal';
                }
                else if (ctx.modifierList().PublicKeyword().length > 0) {
                    visibility = 'public';
                }
                else {
                    visibility = 'default';
                }
                isConstructor = true;
                break;
            case 'fallback':
                parameters = ctx
                    .parameterList()
                    .parameter()
                    .map((x) => this.visit(x));
                returnParameters =
                    ctxReturnParameters !== undefined
                        ? this.visitReturnParameters(ctxReturnParameters)
                        : null;
                visibility = 'external';
                isFallback = true;
                break;
            case 'receive':
                visibility = 'external';
                isReceiveEther = true;
                break;
            case 'function': {
                const identifier = ctx.functionDescriptor().identifier();
                name = identifier !== undefined ? this._toText(identifier) : '';
                parameters = ctx
                    .parameterList()
                    .parameter()
                    .map((x) => this.visit(x));
                returnParameters =
                    ctxReturnParameters !== undefined
                        ? this.visitReturnParameters(ctxReturnParameters)
                        : null;
                // parse function visibility
                if (ctx.modifierList().ExternalKeyword().length > 0) {
                    visibility = 'external';
                }
                else if (ctx.modifierList().InternalKeyword().length > 0) {
                    visibility = 'internal';
                }
                else if (ctx.modifierList().PublicKeyword().length > 0) {
                    visibility = 'public';
                }
                else if (ctx.modifierList().PrivateKeyword().length > 0) {
                    visibility = 'private';
                }
                isConstructor = name === this._currentContract;
                isFallback = name === '';
                break;
            }
        }
        // check if function is virtual
        if (ctx.modifierList().VirtualKeyword().length > 0) {
            isVirtual = true;
        }
        let override;
        const overrideSpecifier = ctx.modifierList().overrideSpecifier();
        if (overrideSpecifier.length === 0) {
            override = null;
        }
        else {
            override = overrideSpecifier[0]
                .userDefinedTypeName()
                .map((x) => this.visitUserDefinedTypeName(x));
        }
        const node = {
            type: 'FunctionDefinition',
            name,
            parameters,
            returnParameters,
            body: block,
            visibility,
            modifiers,
            override,
            isConstructor,
            isReceiveEther,
            isFallback,
            isVirtual,
            stateMutability,
        };
        return this._addMeta(node, ctx);
    }
    visitEnumDefinition(ctx) {
        const node = {
            type: 'EnumDefinition',
            name: this._toText(ctx.identifier()),
            members: ctx.enumValue().map((x) => this.visitEnumValue(x)),
        };
        return this._addMeta(node, ctx);
    }
    visitEnumValue(ctx) {
        const node = {
            type: 'EnumValue',
            name: this._toText(ctx.identifier()),
        };
        return this._addMeta(node, ctx);
    }
    visitElementaryTypeName(ctx) {
        const node = {
            type: 'ElementaryTypeName',
            name: this._toText(ctx),
            stateMutability: null,
        };
        return this._addMeta(node, ctx);
    }
    visitIdentifier(ctx) {
        const node = {
            type: 'Identifier',
            name: this._toText(ctx),
        };
        return this._addMeta(node, ctx);
    }
    visitTypeName(ctx) {
        var _a;
        if (ctx.children !== undefined && ctx.children.length > 2) {
            let length = null;
            if (ctx.children.length === 4) {
                const expression = ctx.expression();
                if (expression === undefined) {
                    throw new Error('Assertion error: a typeName with 4 children should have an expression');
                }
                length = this.visitExpression(expression);
            }
            const ctxTypeName = ctx.typeName();
            const node = {
                type: 'ArrayTypeName',
                baseTypeName: this.visitTypeName(ctxTypeName),
                length,
            };
            return this._addMeta(node, ctx);
        }
        if (((_a = ctx.children) === null || _a === void 0 ? void 0 : _a.length) === 2) {
            const node = {
                type: 'ElementaryTypeName',
                name: this._toText(ctx.getChild(0)),
                stateMutability: this._toText(ctx.getChild(1)),
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.elementaryTypeName() !== undefined) {
            return this.visitElementaryTypeName(ctx.elementaryTypeName());
        }
        if (ctx.userDefinedTypeName() !== undefined) {
            return this.visitUserDefinedTypeName(ctx.userDefinedTypeName());
        }
        if (ctx.mapping() !== undefined) {
            return this.visitMapping(ctx.mapping());
        }
        if (ctx.functionTypeName() !== undefined) {
            return this.visitFunctionTypeName(ctx.functionTypeName());
        }
        throw new Error('Assertion error: unhandled type name case');
    }
    visitUserDefinedTypeName(ctx) {
        const node = {
            type: 'UserDefinedTypeName',
            namePath: this._toText(ctx),
        };
        return this._addMeta(node, ctx);
    }
    visitUsingForDeclaration(ctx) {
        let typeName = null;
        const ctxTypeName = ctx.typeName();
        if (ctxTypeName !== undefined) {
            typeName = this.visitTypeName(ctxTypeName);
        }
        const isGlobal = ctx.GlobalKeyword() !== undefined;
        const usingForObjectCtx = ctx.usingForObject();
        const userDefinedTypeNameCtx = usingForObjectCtx.userDefinedTypeName();
        let node;
        if (userDefinedTypeNameCtx !== undefined) {
            // using Lib for ...
            node = {
                type: 'UsingForDeclaration',
                isGlobal,
                typeName,
                libraryName: this._toText(userDefinedTypeNameCtx),
                functions: [],
                operators: [],
            };
        }
        else {
            // using { } for ...
            const usingForObjectDirectives = usingForObjectCtx.usingForObjectDirective();
            const functions = [];
            const operators = [];
            for (const usingForObjectDirective of usingForObjectDirectives) {
                functions.push(this._toText(usingForObjectDirective.userDefinedTypeName()));
                const operator = usingForObjectDirective.userDefinableOperators();
                if (operator !== undefined) {
                    operators.push(this._toText(operator));
                }
                else {
                    operators.push(null);
                }
            }
            node = {
                type: 'UsingForDeclaration',
                isGlobal,
                typeName,
                libraryName: null,
                functions,
                operators,
            };
        }
        return this._addMeta(node, ctx);
    }
    visitPragmaDirective(ctx) {
        // this converts something like >= 0.5.0  <0.7.0
        // in >=0.5.0 <0.7.0
        const versionContext = ctx.pragmaValue().version();
        let value = this._toText(ctx.pragmaValue());
        if ((versionContext === null || versionContext === void 0 ? void 0 : versionContext.children) !== undefined) {
            value = versionContext.children.map((x) => this._toText(x)).join(' ');
        }
        const node = {
            type: 'PragmaDirective',
            name: this._toText(ctx.pragmaName()),
            value,
        };
        return this._addMeta(node, ctx);
    }
    visitInheritanceSpecifier(ctx) {
        const exprList = ctx.expressionList();
        const args = exprList !== undefined
            ? exprList.expression().map((x) => this.visitExpression(x))
            : [];
        const node = {
            type: 'InheritanceSpecifier',
            baseName: this.visitUserDefinedTypeName(ctx.userDefinedTypeName()),
            arguments: args,
        };
        return this._addMeta(node, ctx);
    }
    visitModifierInvocation(ctx) {
        const exprList = ctx.expressionList();
        let args;
        if (exprList != null) {
            args = exprList.expression().map((x) => this.visit(x));
        }
        else if (ctx.children !== undefined && ctx.children.length > 1) {
            args = [];
        }
        else {
            args = null;
        }
        const node = {
            type: 'ModifierInvocation',
            name: this._toText(ctx.identifier()),
            arguments: args,
        };
        return this._addMeta(node, ctx);
    }
    visitFunctionTypeName(ctx) {
        const parameterTypes = ctx
            .functionTypeParameterList(0)
            .functionTypeParameter()
            .map((typeCtx) => this.visitFunctionTypeParameter(typeCtx));
        let returnTypes = [];
        if (ctx.functionTypeParameterList().length > 1) {
            returnTypes = ctx
                .functionTypeParameterList(1)
                .functionTypeParameter()
                .map((typeCtx) => this.visitFunctionTypeParameter(typeCtx));
        }
        let visibility = 'default';
        if (ctx.InternalKeyword().length > 0) {
            visibility = 'internal';
        }
        else if (ctx.ExternalKeyword().length > 0) {
            visibility = 'external';
        }
        let stateMutability = null;
        if (ctx.stateMutability().length > 0) {
            stateMutability = this._toText(ctx.stateMutability(0));
        }
        const node = {
            type: 'FunctionTypeName',
            parameterTypes,
            returnTypes,
            visibility,
            stateMutability,
        };
        return this._addMeta(node, ctx);
    }
    visitFunctionTypeParameter(ctx) {
        let storageLocation = null;
        if (ctx.storageLocation()) {
            storageLocation = this._toText(ctx.storageLocation());
        }
        const node = {
            type: 'VariableDeclaration',
            typeName: this.visitTypeName(ctx.typeName()),
            name: null,
            identifier: null,
            storageLocation,
            isStateVar: false,
            isIndexed: false,
            expression: null,
        };
        return this._addMeta(node, ctx);
    }
    visitThrowStatement(ctx) {
        const node = {
            type: 'ThrowStatement',
        };
        return this._addMeta(node, ctx);
    }
    visitReturnStatement(ctx) {
        let expression = null;
        const ctxExpression = ctx.expression();
        if (ctxExpression) {
            expression = this.visitExpression(ctxExpression);
        }
        const node = {
            type: 'ReturnStatement',
            expression,
        };
        return this._addMeta(node, ctx);
    }
    visitEmitStatement(ctx) {
        const node = {
            type: 'EmitStatement',
            eventCall: this.visitFunctionCall(ctx.functionCall()),
        };
        return this._addMeta(node, ctx);
    }
    visitCustomErrorDefinition(ctx) {
        const node = {
            type: 'CustomErrorDefinition',
            name: this._toText(ctx.identifier()),
            parameters: this.visitParameterList(ctx.parameterList()),
        };
        return this._addMeta(node, ctx);
    }
    visitTypeDefinition(ctx) {
        const node = {
            type: 'TypeDefinition',
            name: this._toText(ctx.identifier()),
            definition: this.visitElementaryTypeName(ctx.elementaryTypeName()),
        };
        return this._addMeta(node, ctx);
    }
    visitRevertStatement(ctx) {
        const node = {
            type: 'RevertStatement',
            revertCall: this.visitFunctionCall(ctx.functionCall()),
        };
        return this._addMeta(node, ctx);
    }
    visitFunctionCall(ctx) {
        let args = [];
        const names = [];
        const identifiers = [];
        const ctxArgs = ctx.functionCallArguments();
        const ctxArgsExpressionList = ctxArgs.expressionList();
        const ctxArgsNameValueList = ctxArgs.nameValueList();
        if (ctxArgsExpressionList) {
            args = ctxArgsExpressionList
                .expression()
                .map((exprCtx) => this.visitExpression(exprCtx));
        }
        else if (ctxArgsNameValueList) {
            for (const nameValue of ctxArgsNameValueList.nameValue()) {
                args.push(this.visitExpression(nameValue.expression()));
                names.push(this._toText(nameValue.identifier()));
                identifiers.push(this.visitIdentifier(nameValue.identifier()));
            }
        }
        const node = {
            type: 'FunctionCall',
            expression: this.visitExpression(ctx.expression()),
            arguments: args,
            names,
            identifiers,
        };
        return this._addMeta(node, ctx);
    }
    visitStructDefinition(ctx) {
        const node = {
            type: 'StructDefinition',
            name: this._toText(ctx.identifier()),
            members: ctx
                .variableDeclaration()
                .map((x) => this.visitVariableDeclaration(x)),
        };
        return this._addMeta(node, ctx);
    }
    visitWhileStatement(ctx) {
        const node = {
            type: 'WhileStatement',
            condition: this.visitExpression(ctx.expression()),
            body: this.visitStatement(ctx.statement()),
        };
        return this._addMeta(node, ctx);
    }
    visitDoWhileStatement(ctx) {
        const node = {
            type: 'DoWhileStatement',
            condition: this.visitExpression(ctx.expression()),
            body: this.visitStatement(ctx.statement()),
        };
        return this._addMeta(node, ctx);
    }
    visitIfStatement(ctx) {
        const trueBody = this.visitStatement(ctx.statement(0));
        let falseBody = null;
        if (ctx.statement().length > 1) {
            falseBody = this.visitStatement(ctx.statement(1));
        }
        const node = {
            type: 'IfStatement',
            condition: this.visitExpression(ctx.expression()),
            trueBody,
            falseBody,
        };
        return this._addMeta(node, ctx);
    }
    visitTryStatement(ctx) {
        let returnParameters = null;
        const ctxReturnParameters = ctx.returnParameters();
        if (ctxReturnParameters !== undefined) {
            returnParameters = this.visitReturnParameters(ctxReturnParameters);
        }
        const catchClauses = ctx
            .catchClause()
            .map((exprCtx) => this.visitCatchClause(exprCtx));
        const node = {
            type: 'TryStatement',
            expression: this.visitExpression(ctx.expression()),
            returnParameters,
            body: this.visitBlock(ctx.block()),
            catchClauses,
        };
        return this._addMeta(node, ctx);
    }
    visitCatchClause(ctx) {
        let parameters = null;
        if (ctx.parameterList()) {
            parameters = this.visitParameterList(ctx.parameterList());
        }
        if (ctx.identifier() &&
            this._toText(ctx.identifier()) !== 'Error' &&
            this._toText(ctx.identifier()) !== 'Panic') {
            throw new Error('Expected "Error" or "Panic" identifier in catch clause');
        }
        let kind = null;
        const ctxIdentifier = ctx.identifier();
        if (ctxIdentifier !== undefined) {
            kind = this._toText(ctxIdentifier);
        }
        const node = {
            type: 'CatchClause',
            // deprecated, use the `kind` property instead,
            isReasonStringType: kind === 'Error',
            kind,
            parameters,
            body: this.visitBlock(ctx.block()),
        };
        return this._addMeta(node, ctx);
    }
    visitExpressionStatement(ctx) {
        if (!ctx) {
            return null;
        }
        const node = {
            type: 'ExpressionStatement',
            expression: this.visitExpression(ctx.expression()),
        };
        return this._addMeta(node, ctx);
    }
    visitNumberLiteral(ctx) {
        var _a;
        const number = this._toText(ctx.getChild(0));
        let subdenomination = null;
        if (((_a = ctx.children) === null || _a === void 0 ? void 0 : _a.length) === 2) {
            subdenomination = this._toText(ctx.getChild(1));
        }
        const node = {
            type: 'NumberLiteral',
            number,
            subdenomination: subdenomination,
        };
        return this._addMeta(node, ctx);
    }
    visitMappingKey(ctx) {
        if (ctx.elementaryTypeName()) {
            return this.visitElementaryTypeName(ctx.elementaryTypeName());
        }
        else if (ctx.userDefinedTypeName()) {
            return this.visitUserDefinedTypeName(ctx.userDefinedTypeName());
        }
        else {
            throw new Error('Expected MappingKey to have either ' +
                'elementaryTypeName or userDefinedTypeName');
        }
    }
    visitMapping(ctx) {
        const mappingKeyNameCtx = ctx.mappingKeyName();
        const mappingValueNameCtx = ctx.mappingValueName();
        const node = {
            type: 'Mapping',
            keyType: this.visitMappingKey(ctx.mappingKey()),
            keyName: mappingKeyNameCtx === undefined
                ? null
                : this.visitIdentifier(mappingKeyNameCtx.identifier()),
            valueType: this.visitTypeName(ctx.typeName()),
            valueName: mappingValueNameCtx === undefined
                ? null
                : this.visitIdentifier(mappingValueNameCtx.identifier()),
        };
        return this._addMeta(node, ctx);
    }
    visitModifierDefinition(ctx) {
        let parameters = null;
        if (ctx.parameterList()) {
            parameters = this.visitParameterList(ctx.parameterList());
        }
        let isVirtual = false;
        if (ctx.VirtualKeyword().length > 0) {
            isVirtual = true;
        }
        let override;
        const overrideSpecifier = ctx.overrideSpecifier();
        if (overrideSpecifier.length === 0) {
            override = null;
        }
        else {
            override = overrideSpecifier[0]
                .userDefinedTypeName()
                .map((x) => this.visitUserDefinedTypeName(x));
        }
        let body = null;
        const blockCtx = ctx.block();
        if (blockCtx !== undefined) {
            body = this.visitBlock(blockCtx);
        }
        const node = {
            type: 'ModifierDefinition',
            name: this._toText(ctx.identifier()),
            parameters,
            body,
            isVirtual,
            override,
        };
        return this._addMeta(node, ctx);
    }
    visitUncheckedStatement(ctx) {
        const node = {
            type: 'UncheckedStatement',
            block: this.visitBlock(ctx.block()),
        };
        return this._addMeta(node, ctx);
    }
    visitExpression(ctx) {
        let op;
        switch (ctx.children.length) {
            case 1: {
                // primary expression
                const primaryExpressionCtx = ctx.tryGetRuleContext(0, SP.PrimaryExpressionContext);
                if (primaryExpressionCtx === undefined) {
                    throw new Error('Assertion error: primary expression should exist when children length is 1');
                }
                return this.visitPrimaryExpression(primaryExpressionCtx);
            }
            case 2:
                op = this._toText(ctx.getChild(0));
                // new expression
                if (op === 'new') {
                    const node = {
                        type: 'NewExpression',
                        typeName: this.visitTypeName(ctx.typeName()),
                    };
                    return this._addMeta(node, ctx);
                }
                // prefix operators
                if (AST.unaryOpValues.includes(op)) {
                    const node = {
                        type: 'UnaryOperation',
                        operator: op,
                        subExpression: this.visitExpression(ctx.getRuleContext(0, SP.ExpressionContext)),
                        isPrefix: true,
                    };
                    return this._addMeta(node, ctx);
                }
                op = this._toText(ctx.getChild(1));
                // postfix operators
                if (['++', '--'].includes(op)) {
                    const node = {
                        type: 'UnaryOperation',
                        operator: op,
                        subExpression: this.visitExpression(ctx.getRuleContext(0, SP.ExpressionContext)),
                        isPrefix: false,
                    };
                    return this._addMeta(node, ctx);
                }
                break;
            case 3:
                // treat parenthesis as no-op
                if (this._toText(ctx.getChild(0)) === '(' &&
                    this._toText(ctx.getChild(2)) === ')') {
                    const node = {
                        type: 'TupleExpression',
                        components: [
                            this.visitExpression(ctx.getRuleContext(0, SP.ExpressionContext)),
                        ],
                        isArray: false,
                    };
                    return this._addMeta(node, ctx);
                }
                op = this._toText(ctx.getChild(1));
                // member access
                if (op === '.') {
                    const node = {
                        type: 'MemberAccess',
                        expression: this.visitExpression(ctx.expression(0)),
                        memberName: this._toText(ctx.identifier()),
                    };
                    return this._addMeta(node, ctx);
                }
                if (isBinOp(op)) {
                    const node = {
                        type: 'BinaryOperation',
                        operator: op,
                        left: this.visitExpression(ctx.expression(0)),
                        right: this.visitExpression(ctx.expression(1)),
                    };
                    return this._addMeta(node, ctx);
                }
                break;
            case 4:
                // function call
                if (this._toText(ctx.getChild(1)) === '(' &&
                    this._toText(ctx.getChild(3)) === ')') {
                    let args = [];
                    const names = [];
                    const identifiers = [];
                    const ctxArgs = ctx.functionCallArguments();
                    if (ctxArgs.expressionList()) {
                        args = ctxArgs
                            .expressionList()
                            .expression()
                            .map((exprCtx) => this.visitExpression(exprCtx));
                    }
                    else if (ctxArgs.nameValueList()) {
                        for (const nameValue of ctxArgs.nameValueList().nameValue()) {
                            args.push(this.visitExpression(nameValue.expression()));
                            names.push(this._toText(nameValue.identifier()));
                            identifiers.push(this.visitIdentifier(nameValue.identifier()));
                        }
                    }
                    const node = {
                        type: 'FunctionCall',
                        expression: this.visitExpression(ctx.expression(0)),
                        arguments: args,
                        names,
                        identifiers,
                    };
                    return this._addMeta(node, ctx);
                }
                // index access
                if (this._toText(ctx.getChild(1)) === '[' &&
                    this._toText(ctx.getChild(3)) === ']') {
                    if (ctx.getChild(2).text === ':') {
                        const node = {
                            type: 'IndexRangeAccess',
                            base: this.visitExpression(ctx.expression(0)),
                        };
                        return this._addMeta(node, ctx);
                    }
                    const node = {
                        type: 'IndexAccess',
                        base: this.visitExpression(ctx.expression(0)),
                        index: this.visitExpression(ctx.expression(1)),
                    };
                    return this._addMeta(node, ctx);
                }
                // expression with nameValueList
                if (this._toText(ctx.getChild(1)) === '{' &&
                    this._toText(ctx.getChild(3)) === '}') {
                    const node = {
                        type: 'NameValueExpression',
                        expression: this.visitExpression(ctx.expression(0)),
                        arguments: this.visitNameValueList(ctx.nameValueList()),
                    };
                    return this._addMeta(node, ctx);
                }
                break;
            case 5:
                // ternary operator
                if (this._toText(ctx.getChild(1)) === '?' &&
                    this._toText(ctx.getChild(3)) === ':') {
                    const node = {
                        type: 'Conditional',
                        condition: this.visitExpression(ctx.expression(0)),
                        trueExpression: this.visitExpression(ctx.expression(1)),
                        falseExpression: this.visitExpression(ctx.expression(2)),
                    };
                    return this._addMeta(node, ctx);
                }
                // index range access
                if (this._toText(ctx.getChild(1)) === '[' &&
                    this._toText(ctx.getChild(2)) === ':' &&
                    this._toText(ctx.getChild(4)) === ']') {
                    const node = {
                        type: 'IndexRangeAccess',
                        base: this.visitExpression(ctx.expression(0)),
                        indexEnd: this.visitExpression(ctx.expression(1)),
                    };
                    return this._addMeta(node, ctx);
                }
                else if (this._toText(ctx.getChild(1)) === '[' &&
                    this._toText(ctx.getChild(3)) === ':' &&
                    this._toText(ctx.getChild(4)) === ']') {
                    const node = {
                        type: 'IndexRangeAccess',
                        base: this.visitExpression(ctx.expression(0)),
                        indexStart: this.visitExpression(ctx.expression(1)),
                    };
                    return this._addMeta(node, ctx);
                }
                break;
            case 6:
                // index range access
                if (this._toText(ctx.getChild(1)) === '[' &&
                    this._toText(ctx.getChild(3)) === ':' &&
                    this._toText(ctx.getChild(5)) === ']') {
                    const node = {
                        type: 'IndexRangeAccess',
                        base: this.visitExpression(ctx.expression(0)),
                        indexStart: this.visitExpression(ctx.expression(1)),
                        indexEnd: this.visitExpression(ctx.expression(2)),
                    };
                    return this._addMeta(node, ctx);
                }
                break;
        }
        throw new Error('Unrecognized expression');
    }
    visitNameValueList(ctx) {
        const names = [];
        const identifiers = [];
        const args = [];
        for (const nameValue of ctx.nameValue()) {
            names.push(this._toText(nameValue.identifier()));
            identifiers.push(this.visitIdentifier(nameValue.identifier()));
            args.push(this.visitExpression(nameValue.expression()));
        }
        const node = {
            type: 'NameValueList',
            names,
            identifiers,
            arguments: args,
        };
        return this._addMeta(node, ctx);
    }
    visitFileLevelConstant(ctx) {
        const type = this.visitTypeName(ctx.typeName());
        const iden = ctx.identifier();
        const name = this._toText(iden);
        const expression = this.visitExpression(ctx.expression());
        const node = {
            type: 'FileLevelConstant',
            typeName: type,
            name,
            initialValue: expression,
            isDeclaredConst: true,
            isImmutable: false,
        };
        return this._addMeta(node, ctx);
    }
    visitForStatement(ctx) {
        let conditionExpression = this.visitExpressionStatement(ctx.expressionStatement());
        if (conditionExpression) {
            conditionExpression = conditionExpression.expression;
        }
        const node = {
            type: 'ForStatement',
            initExpression: ctx.simpleStatement()
                ? this.visitSimpleStatement(ctx.simpleStatement())
                : null,
            conditionExpression,
            loopExpression: {
                type: 'ExpressionStatement',
                expression: ctx.expression() !== undefined
                    ? this.visitExpression(ctx.expression())
                    : null,
            },
            body: this.visitStatement(ctx.statement()),
        };
        return this._addMeta(node, ctx);
    }
    visitHexLiteral(ctx) {
        const parts = ctx
            .HexLiteralFragment()
            .map((x) => this._toText(x))
            .map((x) => x.substring(4, x.length - 1));
        const node = {
            type: 'HexLiteral',
            value: parts.join(''),
            parts,
        };
        return this._addMeta(node, ctx);
    }
    visitPrimaryExpression(ctx) {
        if (ctx.BooleanLiteral()) {
            const node = {
                type: 'BooleanLiteral',
                value: this._toText(ctx.BooleanLiteral()) === 'true',
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.hexLiteral()) {
            return this.visitHexLiteral(ctx.hexLiteral());
        }
        if (ctx.stringLiteral()) {
            const fragments = ctx
                .stringLiteral()
                .StringLiteralFragment()
                .map((stringLiteralFragmentCtx) => {
                let text = this._toText(stringLiteralFragmentCtx);
                const isUnicode = text.slice(0, 7) === 'unicode';
                if (isUnicode) {
                    text = text.slice(7);
                }
                const singleQuotes = text[0] === "'";
                const textWithoutQuotes = text.substring(1, text.length - 1);
                const value = singleQuotes
                    ? textWithoutQuotes.replace(new RegExp("\\\\'", 'g'), "'")
                    : textWithoutQuotes.replace(new RegExp('\\\\"', 'g'), '"');
                return { value, isUnicode };
            });
            const parts = fragments.map((x) => x.value);
            const node = {
                type: 'StringLiteral',
                value: parts.join(''),
                parts,
                isUnicode: fragments.map((x) => x.isUnicode),
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.numberLiteral()) {
            return this.visitNumberLiteral(ctx.numberLiteral());
        }
        if (ctx.TypeKeyword()) {
            const node = {
                type: 'Identifier',
                name: 'type',
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.typeName()) {
            return this.visitTypeName(ctx.typeName());
        }
        return this.visit(ctx.getChild(0));
    }
    visitTupleExpression(ctx) {
        // remove parentheses
        const children = ctx.children.slice(1, -1);
        const components = this._mapCommasToNulls(children).map((expr) => {
            // add a null for each empty value
            if (expr === null) {
                return null;
            }
            return this.visit(expr);
        });
        const node = {
            type: 'TupleExpression',
            components,
            isArray: this._toText(ctx.getChild(0)) === '[',
        };
        return this._addMeta(node, ctx);
    }
    buildIdentifierList(ctx) {
        // remove parentheses
        const children = ctx.children.slice(1, -1);
        const identifiers = ctx.identifier();
        let i = 0;
        return this._mapCommasToNulls(children).map((idenOrNull) => {
            // add a null for each empty value
            if (!idenOrNull) {
                return null;
            }
            const iden = identifiers[i];
            i++;
            const node = {
                type: 'VariableDeclaration',
                name: this._toText(iden),
                identifier: this.visitIdentifier(iden),
                isStateVar: false,
                isIndexed: false,
                typeName: null,
                storageLocation: null,
                expression: null,
            };
            return this._addMeta(node, iden);
        });
    }
    buildVariableDeclarationList(ctx) {
        var _a;
        const variableDeclarations = ctx.variableDeclaration();
        let i = 0;
        return this._mapCommasToNulls((_a = ctx.children) !== null && _a !== void 0 ? _a : []).map((declOrNull) => {
            // add a null for each empty value
            if (!declOrNull) {
                return null;
            }
            const decl = variableDeclarations[i];
            i++;
            let storageLocation = null;
            if (decl.storageLocation()) {
                storageLocation = this._toText(decl.storageLocation());
            }
            const identifierCtx = decl.identifier();
            const result = {
                type: 'VariableDeclaration',
                name: this._toText(identifierCtx),
                identifier: this.visitIdentifier(identifierCtx),
                typeName: this.visitTypeName(decl.typeName()),
                storageLocation,
                isStateVar: false,
                isIndexed: false,
                expression: null,
            };
            return this._addMeta(result, decl);
        });
    }
    visitImportDirective(ctx) {
        const pathString = this._toText(ctx.importPath());
        let unitAlias = null;
        let unitAliasIdentifier = null;
        let symbolAliases = null;
        let symbolAliasesIdentifiers = null;
        if (ctx.importDeclaration().length > 0) {
            symbolAliases = ctx.importDeclaration().map((decl) => {
                const symbol = this._toText(decl.identifier(0));
                let alias = null;
                if (decl.identifier().length > 1) {
                    alias = this._toText(decl.identifier(1));
                }
                return [symbol, alias];
            });
            symbolAliasesIdentifiers = ctx.importDeclaration().map((decl) => {
                const symbolIdentifier = this.visitIdentifier(decl.identifier(0));
                let aliasIdentifier = null;
                if (decl.identifier().length > 1) {
                    aliasIdentifier = this.visitIdentifier(decl.identifier(1));
                }
                return [symbolIdentifier, aliasIdentifier];
            });
        }
        else {
            const identifierCtxList = ctx.identifier();
            if (identifierCtxList.length === 0) {
                // nothing to do
            }
            else if (identifierCtxList.length === 1) {
                const aliasIdentifierCtx = ctx.identifier(0);
                unitAlias = this._toText(aliasIdentifierCtx);
                unitAliasIdentifier = this.visitIdentifier(aliasIdentifierCtx);
            }
            else if (identifierCtxList.length === 2) {
                const aliasIdentifierCtx = ctx.identifier(1);
                unitAlias = this._toText(aliasIdentifierCtx);
                unitAliasIdentifier = this.visitIdentifier(aliasIdentifierCtx);
            }
            else {
                throw new Error('Assertion error: an import should have one or two identifiers');
            }
        }
        const path = pathString.substring(1, pathString.length - 1);
        const pathLiteral = {
            type: 'StringLiteral',
            value: path,
            parts: [path],
            isUnicode: [false], // paths in imports don't seem to support unicode literals
        };
        const node = {
            type: 'ImportDirective',
            path,
            pathLiteral: this._addMeta(pathLiteral, ctx.importPath()),
            unitAlias,
            unitAliasIdentifier,
            symbolAliases,
            symbolAliasesIdentifiers,
        };
        return this._addMeta(node, ctx);
    }
    buildEventParameterList(ctx) {
        return ctx.eventParameter().map((paramCtx) => {
            const type = this.visit(paramCtx.typeName());
            let name = null;
            if (paramCtx.identifier()) {
                name = this._toText(paramCtx.identifier());
            }
            return {
                type: 'VariableDeclaration',
                typeName: type,
                name,
                isStateVar: false,
                isIndexed: !!paramCtx.IndexedKeyword(0),
            };
        });
    }
    visitReturnParameters(ctx) {
        return this.visitParameterList(ctx.parameterList());
    }
    visitParameterList(ctx) {
        return ctx.parameter().map((paramCtx) => this.visitParameter(paramCtx));
    }
    visitInlineAssemblyStatement(ctx) {
        let language = null;
        if (ctx.StringLiteralFragment()) {
            language = this._toText(ctx.StringLiteralFragment());
            language = language.substring(1, language.length - 1);
        }
        const flags = [];
        const flag = ctx.inlineAssemblyStatementFlag();
        if (flag !== undefined) {
            const flagString = this._toText(flag.stringLiteral());
            flags.push(flagString.slice(1, flagString.length - 1));
        }
        const node = {
            type: 'InlineAssemblyStatement',
            language,
            flags,
            body: this.visitAssemblyBlock(ctx.assemblyBlock()),
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyBlock(ctx) {
        const operations = ctx
            .assemblyItem()
            .map((item) => this.visitAssemblyItem(item));
        const node = {
            type: 'AssemblyBlock',
            operations,
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyItem(ctx) {
        let text;
        if (ctx.hexLiteral()) {
            return this.visitHexLiteral(ctx.hexLiteral());
        }
        if (ctx.stringLiteral()) {
            text = this._toText(ctx.stringLiteral());
            const value = text.substring(1, text.length - 1);
            const node = {
                type: 'StringLiteral',
                value,
                parts: [value],
                isUnicode: [false], // assembly doesn't seem to support unicode literals right now
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.BreakKeyword()) {
            const node = {
                type: 'Break',
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.ContinueKeyword()) {
            const node = {
                type: 'Continue',
            };
            return this._addMeta(node, ctx);
        }
        return this.visit(ctx.getChild(0));
    }
    visitAssemblyExpression(ctx) {
        return this.visit(ctx.getChild(0));
    }
    visitAssemblyCall(ctx) {
        const functionName = this._toText(ctx.getChild(0));
        const args = ctx
            .assemblyExpression()
            .map((assemblyExpr) => this.visitAssemblyExpression(assemblyExpr));
        const node = {
            type: 'AssemblyCall',
            functionName,
            arguments: args,
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyLiteral(ctx) {
        let text;
        if (ctx.stringLiteral()) {
            text = this._toText(ctx);
            const value = text.substring(1, text.length - 1);
            const node = {
                type: 'StringLiteral',
                value,
                parts: [value],
                isUnicode: [false], // assembly doesn't seem to support unicode literals right now
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.BooleanLiteral()) {
            const node = {
                type: 'BooleanLiteral',
                value: this._toText(ctx.BooleanLiteral()) === 'true',
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.DecimalNumber()) {
            const node = {
                type: 'DecimalNumber',
                value: this._toText(ctx),
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.HexNumber()) {
            const node = {
                type: 'HexNumber',
                value: this._toText(ctx),
            };
            return this._addMeta(node, ctx);
        }
        if (ctx.hexLiteral()) {
            return this.visitHexLiteral(ctx.hexLiteral());
        }
        throw new Error('Should never reach here');
    }
    visitAssemblySwitch(ctx) {
        const node = {
            type: 'AssemblySwitch',
            expression: this.visitAssemblyExpression(ctx.assemblyExpression()),
            cases: ctx.assemblyCase().map((c) => this.visitAssemblyCase(c)),
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyCase(ctx) {
        let value = null;
        if (this._toText(ctx.getChild(0)) === 'case') {
            value = this.visitAssemblyLiteral(ctx.assemblyLiteral());
        }
        const node = {
            type: 'AssemblyCase',
            block: this.visitAssemblyBlock(ctx.assemblyBlock()),
            value,
            default: value === null,
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyLocalDefinition(ctx) {
        const ctxAssemblyIdentifierOrList = ctx.assemblyIdentifierOrList();
        let names;
        if (ctxAssemblyIdentifierOrList.identifier()) {
            names = [this.visitIdentifier(ctxAssemblyIdentifierOrList.identifier())];
        }
        else if (ctxAssemblyIdentifierOrList.assemblyMember()) {
            names = [
                this.visitAssemblyMember(ctxAssemblyIdentifierOrList.assemblyMember()),
            ];
        }
        else {
            names = ctxAssemblyIdentifierOrList
                .assemblyIdentifierList()
                .identifier()
                .map((x) => this.visitIdentifier(x));
        }
        let expression = null;
        if (ctx.assemblyExpression() !== undefined) {
            expression = this.visitAssemblyExpression(ctx.assemblyExpression());
        }
        const node = {
            type: 'AssemblyLocalDefinition',
            names,
            expression,
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyFunctionDefinition(ctx) {
        const ctxAssemblyIdentifierList = ctx.assemblyIdentifierList();
        const args = ctxAssemblyIdentifierList !== undefined
            ? ctxAssemblyIdentifierList
                .identifier()
                .map((x) => this.visitIdentifier(x))
            : [];
        const ctxAssemblyFunctionReturns = ctx.assemblyFunctionReturns();
        const returnArgs = ctxAssemblyFunctionReturns
            ? ctxAssemblyFunctionReturns
                .assemblyIdentifierList()
                .identifier()
                .map((x) => this.visitIdentifier(x))
            : [];
        const node = {
            type: 'AssemblyFunctionDefinition',
            name: this._toText(ctx.identifier()),
            arguments: args,
            returnArguments: returnArgs,
            body: this.visitAssemblyBlock(ctx.assemblyBlock()),
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyAssignment(ctx) {
        const ctxAssemblyIdentifierOrList = ctx.assemblyIdentifierOrList();
        let names;
        if (ctxAssemblyIdentifierOrList.identifier()) {
            names = [this.visitIdentifier(ctxAssemblyIdentifierOrList.identifier())];
        }
        else if (ctxAssemblyIdentifierOrList.assemblyMember()) {
            names = [
                this.visitAssemblyMember(ctxAssemblyIdentifierOrList.assemblyMember()),
            ];
        }
        else {
            names = ctxAssemblyIdentifierOrList
                .assemblyIdentifierList()
                .identifier()
                .map((x) => this.visitIdentifier(x));
        }
        const node = {
            type: 'AssemblyAssignment',
            names,
            expression: this.visitAssemblyExpression(ctx.assemblyExpression()),
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyMember(ctx) {
        const [accessed, member] = ctx.identifier();
        const node = {
            type: 'AssemblyMemberAccess',
            expression: this.visitIdentifier(accessed),
            memberName: this.visitIdentifier(member),
        };
        return this._addMeta(node, ctx);
    }
    visitLabelDefinition(ctx) {
        const node = {
            type: 'LabelDefinition',
            name: this._toText(ctx.identifier()),
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyStackAssignment(ctx) {
        const node = {
            type: 'AssemblyStackAssignment',
            name: this._toText(ctx.identifier()),
            expression: this.visitAssemblyExpression(ctx.assemblyExpression()),
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyFor(ctx) {
        // TODO remove these type assertions
        const node = {
            type: 'AssemblyFor',
            pre: this.visit(ctx.getChild(1)),
            condition: this.visit(ctx.getChild(2)),
            post: this.visit(ctx.getChild(3)),
            body: this.visit(ctx.getChild(4)),
        };
        return this._addMeta(node, ctx);
    }
    visitAssemblyIf(ctx) {
        const node = {
            type: 'AssemblyIf',
            condition: this.visitAssemblyExpression(ctx.assemblyExpression()),
            body: this.visitAssemblyBlock(ctx.assemblyBlock()),
        };
        return this._addMeta(node, ctx);
    }
    visitContinueStatement(ctx) {
        const node = {
            type: 'ContinueStatement',
        };
        return this._addMeta(node, ctx);
    }
    visitBreakStatement(ctx) {
        const node = {
            type: 'BreakStatement',
        };
        return this._addMeta(node, ctx);
    }
    _toText(ctx) {
        const text = ctx.text;
        if (text === undefined) {
            throw new Error('Assertion error: text should never be undefiend');
        }
        return text;
    }
    _stateMutabilityToText(ctx) {
        if (ctx.PureKeyword() !== undefined) {
            return 'pure';
        }
        if (ctx.ConstantKeyword() !== undefined) {
            return 'constant';
        }
        if (ctx.PayableKeyword() !== undefined) {
            return 'payable';
        }
        if (ctx.ViewKeyword() !== undefined) {
            return 'view';
        }
        throw new Error('Assertion error: non-exhaustive stateMutability check');
    }
    _loc(ctx) {
        const sourceLocation = {
            start: {
                line: ctx.start.line,
                column: ctx.start.charPositionInLine,
            },
            end: {
                line: ctx.stop ? ctx.stop.line : ctx.start.line,
                column: ctx.stop
                    ? ctx.stop.charPositionInLine
                    : ctx.start.charPositionInLine,
            },
        };
        return sourceLocation;
    }
    _range(ctx) {
        var _a, _b;
        return [ctx.start.startIndex, (_b = (_a = ctx.stop) === null || _a === void 0 ? void 0 : _a.stopIndex) !== null && _b !== void 0 ? _b : ctx.start.startIndex];
    }
    _addMeta(node, ctx) {
        const nodeWithMeta = {
            type: node.type,
        };
        if (this.options.loc === true) {
            node.loc = this._loc(ctx);
        }
        if (this.options.range === true) {
            node.range = this._range(ctx);
        }
        return {
            ...nodeWithMeta,
            ...node,
        };
    }
    _mapCommasToNulls(children) {
        if (children.length === 0) {
            return [];
        }
        const values = [];
        let comma = true;
        for (const el of children) {
            if (comma) {
                if (this._toText(el) === ',') {
                    values.push(null);
                }
                else {
                    values.push(el);
                    comma = false;
                }
            }
            else {
                if (this._toText(el) !== ',') {
                    throw new Error('expected comma');
                }
                comma = true;
            }
        }
        if (comma) {
            values.push(null);
        }
        return values;
    }
}
function isBinOp(op) {
    return AST.binaryOpValues.includes(op);
}

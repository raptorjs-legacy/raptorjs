/**
 * 
 * 
 */
define(
    'raptor/jsdoc/ASTWalker',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var logger = module.logger(),
            arrays = require('raptor/arrays'),
            Type = require("raptor/jsdoc/Type");

        var toStrings = {
                Literal: function() {
                    return JSON.stringify(this.value);
                },
                
                Identifier: function() {
                    return this.name;
                },
                
                MemberExpression: function() {
                    if (this.computed) {
                        return nodeToString(this.object) + "[" + nodeToString(this.property) + "]";
                    }
                    else {
                        return nodeToString(this.object) + "." + nodeToString(this.property);    
                    }
                    
                },
                
                FunctionExpression: function() {
                    return "function(" + argsToString(this.params) + ") " + nodeToString(this.body);
                },
                
                CallExpression: function() {
                    return nodeToString(this.callee) + "(" + argsToString(this.arguments) + ")";
                },
                
                BlockStatement: function() {
                    return "{" + this.body.map(function(statement) {
                        return nodeToString(statement);
                    }).join(" ") + "}";
                },
                
                ReturnStatement: function() {
                    return "return " + nodeToString(this.argument) + ";";
                },
                
                ExpressionStatement: function() {
                    return nodeToString(this.expression) + ";";
                },
                
                ObjectExpression: function() {
                    return "{" + this.properties.map(function(prop) {
                        return nodeToString(prop);
                    }).join(", ") + "}";
                },
                
                AssignmentExpression: function() {
                    return nodeToString(this.left) + "=" + nodeToString(this.right);
                },
                
                Property: function() {
                    return nodeToString(this.key) + ": " + nodeToString(this.value);
                },
                
                ThisExpression: function() {
                    return "this";
                },
                
                VariableDeclaration: function() {
                    return "var " + this.declarations.map(function(declarator) {
                        return nodeToString(declarator);
                    }).join(",") + ";";
                },
                
                VariableDeclarator: function() {
                    return nodeToString(this.id) + (this.init ? "=" + nodeToString(this.init) : "");  
                }
            },
            nodeToString = function(node) {
                if (!node) {
                    return "[null node]";
                }
                var func = toStrings[node.type];
                return func ? func.call(node) : "[" + node.type + "]";
            },
            nodeInstanceToString = function() {
                return nodeToString(this);
            },
            argsToString = function(args) {
                return args.map(function(arg) {
                    return nodeToString(arg);
                }).join(", ");
            };
            
        var ASTWalker = function(env) {
            this.env = env;
            this.symbols = env.getSymbols();
            
            this.scopeStack = [this.env.getGlobal()];
            this.stack = [];
            this.indent = "";
        };
        
        ASTWalker.prototype = {
            resolveMemberExpressionPropertyName: function(node) {
                var propertyNode = node.property,
                    propName = null;
                    
                if (node.computed === true) {
                    this.walk(node.property);    
                    propName = node.property.resolvedType && node.property.resolvedType.value;
                }
                else {
                    if (propertyNode.type === 'Literal') {
                        propName = propertyNode.value;
                    }
                    else if (propertyNode.type === 'Identifier') {
                        propName = propertyNode.name;
                    }
                    else {
                        throw raptor.createError(new Error("Unexpected type for property node: " + propertyNode.type));
                    }
                }

                return propName;
            },

            resolveAssignmentObject: function(node) {
                
                if (node.type === 'Identifier') {
                    var existingVar = this.currentScope().resolveVar(node.name);
                    if (existingVar) {
                        node.resolvedType = existingVar;
                    }
                    else {
                        var newGlobal = new Type();
                        this.getGlobal().setProperty({
                            name: node.name,
                            type: newGlobal
                        });

                        node.resolvedType = newGlobal;
                    }
                    
                    this.publishAfterWalk(node);
                }
                else if (node.type === 'MemberExpression') {
                    var objectType = this.resolveAssignmentObject(node.object);
                    if (objectType) {

                        var propertyNode = node.property,
                            name;


                        name = this.resolveMemberExpressionPropertyName(node);
                        
                        if (name != null) {
                            var existingProperty = objectType.getPropertyType(name);
                            if (existingProperty) {
                                node.resolvedType = existingProperty;

                            }
                            else {
                                var newProperty = new Type();
                                objectType.setProperty({
                                    name: name,
                                    type: newProperty
                                });

                                node.resolvedType = newProperty;
                            }
                        }


                    }
                    
                    this.publishAfterWalk(node);
                }
                else {
                    this.walk(node);
                }
                return node.resolvedType;
            },
            
            getSymbols: function() {
                return this.symbols;
            },
            
            currentScope: function() {
                return this.scopeStack[this.scopeStack.length-1];
            },
            
            resolveVar: function(name) {
                return this.currentScope().resolveVar(name);
            },
            
            invokeFunctionExpression: function(node, args) {
                if (node.type !== 'FunctionExpression') {
                    throw raptor.createError(new Error("invokeFunctionExpressionNode() Invalid node type: " + node.type));
                }
                
                node.args = args;
                this.walk(node);
                return node.scope;
            },
            
            resolveType: function(node) {
                this.walk(node);
                return node.resolvedType;
            },
            
            getGlobal: function() {
                return this.env.getGlobal();
            },
            
            argsToString: function(args) {
                return argsToString(args);
            },
            
            walk: function(node) {
                var type = node.type;
                node.toString = nodeInstanceToString;
                
                var walkerFunc = this["walk_" + type];
                if (walkerFunc) {
                    if (logger.isDebugEnabled()) {
                        console.log(this.indent + "walk_" + type + ": " + nodeToString(node), node.loc ? "Line: " + node.loc.start.line : "");    
                    }
                    this.indent += "  ";
                    this.stack.push(node);
                    walkerFunc.call(this, node);
                    
                    this.publishAfterWalk(node);
                    arrays.pop(this.stack);
                    this.indent = this.indent.substring(2);
                }
                else {
                    if (logger.isDebugEnabled()) {
                        console.log(this.indent + 'walk(): Unrecognized node of type "' + node.type + '" [' + (node.loc ? node.loc.start.line + ':' + node.loc.start.column : "(unknown location)") + ']: ' + nodeToString(node));
                    }
                }
            },
            
            publishAfterWalk: function(node) {
                this.env.publish(node.type, {
                    scope: this.currentScope(),
                    type: node.resolvedType,
                    comment: node.comment,
                    symbols: this.symbols,
                    node: node,
                    walker: this
                });
            },
            
            walk_Program: function(node) {
                if (node.body) {
                    node.body.forEach(function(bodyStatement) {
                        this.walk(bodyStatement);
                    }, this);
                }

                if (node.comments) {
                    node.comments.forEach(function(comment) {
                        this.walk(comment);
                    }, this);
                }
            },
            
            walk_ExpressionStatement: function(node) {
                if (node.comment) {
                    /*
                     * Pass along the comment from the expression statement to the actual expression "CallExpression" node
                     */
                    node.expression.comment = node.comment;
                }
                this.walk(node.expression);
                
                this.resolvedType = node.expression.resolvedType;
            },
            
            walk_CallExpression: function(node) {
                
                //See if there is a static type resolver for this function
                this.walk(node.callee);
                
                if (node.callee.resolvedType && node.callee.resolvedType.resolver) {
                    /*
                     * Rely on the custom resolver to walk to invoke the function
                     */
                    node.resolvedType = node.callee.resolvedType.resolver(node, this);
                }
                else {
                    /*
                     * If no custom resolver is provided then just walk the arguments
                     */
                    if (node.arguments) {
                        node.arguments.forEach(function(arg) {
                            this.walk(arg);
                        }, this);
                    }
                }
                
                
            },
            
            walk_FunctionExpression: function(node) {
                
                var scope = new Type();
                scope.functionExpressionNode = node;
                scope.functionType = node.resolvedType = new Type("function");
                scope.functionType.functionScope = scope;
                
                node.params.forEach(function(paramNode) {
                    node.resolvedType.addFunctionParam({
                        name: paramNode.name,
                        comment: paramNode.comment
                    });
                }, this);

                scope.setParentScope(arrays.peek(this.scopeStack));
                
                this.scopeStack.push(scope);
                try
                {                    
                    if (node.args) {
                        object.forEachEntry(node.args, function(name, type) {
                            scope.setProperty({
                                name: name,
                                type: type
                            }); //Add the parameters to the scope
                        });    
                    }

                    this.walk(node.body);
                    
                    node.scope = scope;
                }
                finally {
                    arrays.pop(this.scopeStack);
                }
            },
            
            walk_AssignmentExpression: function(node) {
                var leftNode = node.left,
                    rightNode = node.right;
                
                this.walk(rightNode);
                
                var parentType = null,
                    targetPropName = null,
                    resolvedType = null,
                    existingType = null;
                
                if (leftNode.type === 'MemberExpression') {
                    /*
                     * The l-value is a member expression.
                     * 
                     * We will split it into two parts so that
                     * we can add the new property
                     */
                    var objectNode = leftNode.object;
                    var objectType = this.resolveAssignmentObject(objectNode);
                    if (objectType) {

                        var propName = this.resolveMemberExpressionPropertyName(leftNode);
                        targetPropName = propName;
                        parentType = objectType;
                        existingType = objectType && propName ? objectType.getPropertyType(propName) : null;
                    }
                }
                else if (leftNode.type === 'Identifier') {
                    //Simple variable assignment: a = "Hello";
                    existingType = this.currentScope().resolveVar(leftNode.name);
                    targetPropName = leftNode.name;
                    parentType = this.getGlobal(); //Creating a new global
                }
                
                resolvedType = rightNode.resolvedType;
                
                if (existingType) {
                    existingType.addType(resolvedType);
                }
                else if (parentType && targetPropName) {
                    parentType.setProperty({
                        name: targetPropName,
                        type: resolvedType,
                        comment: node.comment
                    });
                }
                
                this.env.publish("assignment", {
                    type: resolvedType,
                    scope: this.currentScope(),
                    comment: node.comment,
                    symbols: this.symbols,
                    node: node,
                    walker: this,
                    setType: function(type) {
                        resolvedType = type;
                    }
                });
                
                node.resolvedType = leftNode.resolvedType = resolvedType;

                this.publishAfterWalk(leftNode);
            },
            
            walk_BlockStatement: function(node) {
                node.body.forEach(function(bodyStatement) {
                    this.walk(bodyStatement);
                }, this);
            },
            
            walk_ReturnStatement: function(node) {

                var type = node.argument ? this.resolveType(node.argument) : null;

                var scope = this.currentScope();
                if (scope.returnType) {
                    if (type) {
                        scope.returnType.addType(type);    
                    }
                }
                else {
                    scope.returnType = type;    
                }
                
                node.resolvedReturnType = scope.returnType;
            },
            
            walk_VariableDeclaration: function(node) {
                
                if (node.comment && node.declarations.length) {
                    //Pass along the comment to the first variable declarator
                    node.declarations[0].comment = node.comment;
                }
                
                node.declarations.forEach(function(declarator) {
                    this.walk(declarator);
                }, this);
                
                
            },
            
            walk_VariableDeclarator: function(node) {
                var scope = this.currentScope();
                var varName = node.id.name,
                    type = null;
                
                if (node.init) {
                    type = this.resolveType(node.init);
                }

                if (node.comment && type) {
                    type.setComment(node.comment);
                }
                
                
                node.resolvedType = type;
                
                this.env.publish("assignment", {
                    type: type,
                    scope: this.currentScope(),
                    comment: node.comment,
                    symbols: this.symbols,
                    node: node,
                    walker: this,
                    setType: function(type) {
                        node.resolvedType = type;
                    }
                });
                
                this.env.publish("var", {
                    type: type,
                    scope: this.currentScope(),
                    comment: node.comment,
                    symbols: this.symbols,
                    node: node,
                    varName: varName,
                    walker: this,
                    setType: function(type) {
                        node.resolvedType = type;
                    }
                });
                
                scope.addLocalVariable(varName, node.resolvedType, node.comment);
            },
            
            walk_IfStatement: function(node) {
                this.walk(node.test);
                this.walk(node.consequent);
                
                if (node.alternate) {
                    this.walk(node.alternate);
                }
            },

            walk_UnaryExpression: function(node) {
                this.walk(node.argument);
            },
            
            walk_WhileStatement: function(node) {
                this.walk(node.test);
                this.walk(node.body);
                
            },
            
            walk_DoWhileStatement: function(node) {
                this.walk(node.body);
                this.walk(node.test);
            },


            
            walk_MemberExpression: function(node) {
                this.walk(node.object);

                var propertyNode = node.property;
                var propName = this.resolveMemberExpressionPropertyName(node);
                
                
                var objectType = node.object.resolvedType;
                if (objectType && propName) { //Check if the property is a static value
                    node.resolvedType = objectType.getPropertyType(propName);
                }
            },
            
            walk_ObjectExpression: function(node) {
                var objectType = new Type("object");
                
                node.properties.forEach(function(prop) {
                    var keyNode = prop.key,
                        key;
                    
                    

                    this.walk(prop);
                    
                    if (keyNode.type === 'Identifier') {
                        key = keyNode.name;
                    }
                    else if (keyNode.type === 'Literal') {
                        key = keyNode.value;
                    }
                    else {
                        throw raptor.createError(new Error('Invalid type: ' + keyNode.type));
                    }

                    objectType.setProperty({
                        name: key,
                        type: prop.resolvedType || prop.value.resolvedType,
                        comment: prop.comment
                    });  
                    

                }, this);
                
                node.resolvedType = objectType;
            },

            walk_Property: function(node) {
                

                this.walk(node.value);

                this.env.publish("property", {
                    type: node.value.resolvedType,
                    scope: this.currentScope(),
                    comment: node.comment,
                    symbols: this.symbols,
                    node: node,
                    walker: this,
                    setType: function(type) {
                        node.resolvedType = type;
                    }
                });
            },
            
            walk_ThisExpression: function(node) {
                var scope = this.currentScope();
                node.resolvedType = scope.functionType.getInstanceType();
            },
            
            walk_Literal: function(node) {
                node.resolvedType = new Type(typeof node.value);
                node.resolvedType.value = node.value;
            },
            
            walk_Identifier: function(node) {
                
                node.resolvedType = this.currentScope().resolveVar(node.name);
//                
//                if (node.name === 'isArray') {
//                    console.error('isArray: currrentScope=', this.currentScope().parentScope.getPropertyType("isArray"), ' resolvedType=', node.resolvedType);
//                }
            },
            
            walk_JSDocComment: function(node) {
                
            },
            
            walk_BlockComment: function(node) {
                
            },
            
            walk_LineComment: function(node) {
                
            }
        };
        
        return ASTWalker;
        
        
    });
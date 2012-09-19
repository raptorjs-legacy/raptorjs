/**
 * 
 * 
 */
raptor.define(
    "jsdocs.ASTWalker",
    function(raptor) {
        "use strict";
        
        var arrays = raptor.require('arrays'),
            Type = raptor.require("jsdocs.Type");

        var toStrings = {
                Literal: function() {
                    return JSON.stringify(this.value);
                },
                
                Identifier: function() {
                    return this.name;
                },
                
                MemberExpression: function() {
                    return nodeToString(this.object) + "." + nodeToString(this.property);
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
                    }).join("\n") + "}";
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
                    }).join(",") + ";"
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
        };
        
        ASTWalker.prototype = {
            resolveAssignmentObject: function(node) {
                
                if (node.type === 'Identifier') {
                    var existingVar = this.currentScope().resolveVar(node.name);
                    if (existingVar) {
                        node.resolvedType = existingVar;
                    }
                    else {
                        var newGlobal = new Type();
                        this.getGlobal().setProperty(node.name, newGlobal);
                        node.resolvedType = newGlobal;
                    }
                    
                    this.publishAfterWalk(node);
                }
                else if (node.type === 'MemberExpression') {
                    var objectType = this.resolveAssignmentObject(node.object);
                    if (objectType) {
                        var existingProperty = objectType.getPropertyType(node.property.name);
                        if (existingProperty) {
                            node.resolvedType = existingProperty;

                        }
                        else {
                            var newProperty = new Type();
                            objectType.setProperty(node.property.name, newProperty);
                            node.resolvedType = newProperty;
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
                    this.logger().debug("walk_" + type + ": " + nodeToString(node));
                    this.stack.push(node);
                    walkerFunc.call(this, node);
                    
                    this.publishAfterWalk(node);
                    arrays.pop(this.stack);
                }
                else {
                    this.logger().warn('walk(): Unrecognized node of type "' + node.type + '": ' + nodeToString(node));
                }
            },
            
            publishAfterWalk: function(node) {
                this.env.publish(node.type, {
                    scope: this.currentScope(),
                    resolvedType: node.resolvedType,
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
                
                this.scopeStack.push(scope);
                try
                {                    
                    if (node.args) {
                        raptor.forEachEntry(node.args, function(name, type) {
                            scope.setProperty(name, type); //Add the parameters to the scope
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
                
                if (rightNode.resolvedType) {
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
                            objectType.setProperty(leftNode.property.name, rightNode.resolvedType, node.comment);
                        }
                    }
                    else if (leftNode.type === 'Identifier') {
                        //Simple variable assignment: a = "Hello";
                        var existingVarType = this.currentScope().resolveVar(leftNode.name);
                        
                        if (existingVarType) {
                            existingVarType.addType(rightNode.resolvedType);
                            return;
                        }
                        else {
                            //Creating a new global
                            this.getGlobal().setProperty(leftNode.name, rightNode.resolvedType);
                            
                        }
                    }
                    leftNode.resolvedType = rightNode.resolvedType;
                    
                    this.publishAfterWalk(leftNode);
                }
                else {
                    /*
                     * Don't do any assignment but still walk the tree
                     */
                    this.walk(leftNode);
                }
            },
            
            walk_BlockStatement: function(node) {
                node.body.forEach(function(bodyStatement) {
                    this.walk(bodyStatement);
                }, this);
            },
            
            walk_ReturnStatement: function(node) {
                var type = this.resolveType(node.argument);
                var scope = this.currentScope();
                if (scope.returnType) {
                    scope.returnType.addType(type);
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
                
                scope.addLocalVariable(varName, type, node.comment);
                
                this.env.publish("var", {
                    type: type,
                    scope: this.currentScope(),
                    comment: node.comment,
                    symbols: this.symbols,
                    node: node,
                    walker: this
                });
            },
            
            walk_IfStatement: function(node) {
                this.walk(node.test);
                this.walk(node.consequent);
                
                if (node.alternate) {
                    this.walk(node.alternate);
                }
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
                
                //Property is always an identifier... don't try to resolve the property
                
                var objectType = node.object.resolvedType;
                
                if (objectType) {
                    node.resolvedType = objectType.getPropertyType(node.property.name);
                }
            },
            
            walk_ObjectExpression: function(node) {
                var objectType = new Type("object");
                
                node.properties.forEach(function(prop) {
                    var keyNode = prop.key,
                        key;
                    
                    if (keyNode.type === 'Identifier') {
                        key = keyNode.name;
                    }
                    else if (keyNode.type === 'Literal') {
                        key = keyNode.value;
                    }
                    else {
                        throw raptor.createError(new Error('Invalid type: ' + keyNode.type));
                    }
                    
                    this.walk(prop.value);
                    
                    objectType.setProperty(key, prop.value.resolvedType, prop.comment);
                }, this);
                
                node.resolvedType = objectType;
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
            }
        };
        
        return ASTWalker;
        
        
    });
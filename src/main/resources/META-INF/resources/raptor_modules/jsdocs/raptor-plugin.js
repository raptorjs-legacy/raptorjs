raptor.define(
    "jsdocs.raptor-plugin",
    function(raptor) {
        "use strict";
        
        var Type = raptor.require("jsdocs.Type"),
            resolveDefine = function(methodName, node, walker, isClass) {
            
                var name = null,
                    args = node['arguments'],
                    modifiers = null,
                    def = null,
                    type = null;
                
                args.forEach(function(arg, i) {
                    if (arg.type === 'FunctionExpression') {
                        def = arg;
                    }
                    else if (arg.type === 'Literal') {
                        if (i !== 0) {
                            modifiers = {
                                superclass: arg.value
                            };
                        }
                        else {
                            name = arg.value;
                        }
                    }
                    else if (arg.type === 'ObjectExpression') {
                        var objectType = walker.resolveType(arg);
                        
                        if (modifiers || i === args.length-1) {
                            def = objectType;
                        }
                        else {
                            modifiers = objectType;    
                        }
                    }
                });
                
                
                if (!def) {
                    this.logger().warn('Invalid args to "' + methodName + '". Definition argument not found. Args: ' + walker.argsToString(args));
                }
                
                if (def.type === 'FunctionExpression') {
                    var scope = walker.invokeFunctionExpression(def, {
                        "raptor": walker.resolveVar("raptor")
                    });
                    
                    type = scope.returnType;
                    
                    
                    if (name) {
                        /*
                         * Register any anonymous classes
                         */
                        scope.forEachLocalVar(function(prop) {
                            var varName = prop.name, 
                                varType = prop.type;
                            
                            if (varType && varType !== scope.returnType && varType.isJavaScriptFunction() && varType.hasProperty("prototype")) {
                                varType.setName(varName);
                                varType.setAnonymous(true);
                                walker.getSymbols().addSymbol(name + "-" + varName, varType);
                            }
                        }, this);
                    }
                }
                else if (def.type === 'ObjectExpression') {
                    type = walker.resolveType(def);
                }
                
                if (type) {
                    if (node.comment) {
                        //Attach the comment or the main node to the type
                        type.raptorDefineComment = node.comment;
                    }
                    
                    if (modifiers) {
                        type.superclassName = modifiers.superclass;
                        type.raptorModifiers = modifiers;
                    }
                        
                    if (!type.isJavaScriptFunction() && isClass) {
                        /*
                         * The object being defined is a class defined using
                         * raptor.defineClass, but the class definition object
                         * is an object. We need to convert it to a
                         * function type to make it clear that it is a 
                         * class
                         */
                        var initProp = type.getProperty("init");
                        
                        var classType = initProp.type || new Type("function");
                        if (initProp.comment) {
                            classType.setComment(initProp.comment);
                        }
                        
                        var protoType = new Type("object");
                        classType.setProperty("prototype", protoType);
                        type.forEachProperty(function(prop) {
                            if (prop.name === 'init' && prop.type.isJavaScriptFunction()) {
                                classType.setFunctionParamNames(prop.type.getFunctionParamNames());
                            }
                            else {
                                protoType.setProperty(prop.name, prop.type);
                            }
                        });
                        
                        type = classType;
                    }
                     
                    if (type.isJavaScriptFunction()) {
                        if (!type.hasProperty("prototype")) {
                            type.setProperty("prototype", new Type()); //Make it clear that this a class and not just a regular function
                        }
                    }
                    type.setName(name);
                    type.raptorDefineMethod = methodName;
                    type.raptorType = type.isJavaScriptFunction() ? "class" : "module";
                    
                    //TODO: Handle enums and mixins
                }
                
                if (name) {
                    walker.getSymbols().addSymbol(name, type);
                } 
                
                
                if (type && !(type instanceof Type)) {
                    throw raptor.createError(new Error('Invalid type being returned: ' + type));
                }
                
                return type;
            }; /* end resolveDefine */
            
        return {
            load: function(env) {
                
                env.addHandlers({
                    "var": function(eventArgs) {
                        var comment = eventArgs.comment;
                        if (comment) {
                            var nameTag = comment.getTag("name");
                            
                            if (nameTag) {
                                eventArgs.symbols.addSymbol(nameTag.getValue(), eventArgs.type);    
                            }
                        }
                    }
                }, this);
                
                env.getGlobal().addProperties({
                    "raptor": {
                        "require": function(node, walker) {
                            var args = node['arguments'];
                            if (args && args.length === 1) {
                                var nameArg = args[1];
                                if (nameArg.type === 'Literal') {
                                    var name = nameArg.value;
                                    var symbol = walker.resolveSymbol(name);
                                    return symbol ? symbol.getType() : null;
                                }
                            }
                        },
                        
                        "define": function(node, walker) {
                            return resolveDefine.call(this, "raptor.define", node, walker);
                        },
                        
                        "defineClass": function(node, walker) {
                            return resolveDefine.call(this, "raptor.defineClass", node, walker, true);
                        },
                        
                        "defineModule": function(node, walker) {
                            return resolveDefine.call(this, "raptor.defineModule", node, walker);
                        }    
                    }
                });
            }
        };
    });
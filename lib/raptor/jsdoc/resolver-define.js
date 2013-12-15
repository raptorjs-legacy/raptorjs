var Type = require("raptor/jsdoc/Type");

var logger = require('raptor/logging').logger('resolver-define');
var raptor = require('raptor');

module.exports = function(methodName, node, walker, isClass, isExtend, isEnum) {
    'use strict';
    
    var name = null,
        label = null,
        args = node['arguments'],
        modifiers = null,
        def = null,
        type = null,
        extension = null,
        isModule = false;
    
    if (node.comment) {
        if (node.comment.hasTag("extension")) {
            extension = node.comment.getTagValue("extension");
        }
        
        if (node.comment.hasTag("module")) {
            isModule = true;
        }
    }

    var factoryArgs = [];
    
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
                label = arg.value;
                name = raptor.normalize(arg.value);

                if (extension) {
                    name += "_" + extension;
                }
            }
        }
        else if (arg.type === 'ObjectExpression') {
            var objectType = walker.resolveType(arg);
            
            if (modifiers || i === args.length-1) {
                type = objectType;
            }
            else {
                modifiers = objectType;    
            }
        }
        else if (arg.type === 'ArrayExpression') {
            arg.elements.forEach(function(dependency) {
                if (dependency.value === 'require') {
                    type = new Type("function");
                    type.resolver = function(id) {
                        //TODO Come up with a way to resolve dependencies
                    };
                }
                else {
                    factoryArgs.push(new Type("object"));
                }
            }, this);
        }
    });
    
    
    if (!def) {
        logger.warn('Invalid args to "' + methodName + '". Definition argument not found. Args: ' + walker.argsToString(args));
    }
    else if (def.type === 'FunctionExpression') {
        var factoryNamedArgs = {};

        def.params.forEach(function(param, i) {
            if (i < factoryArgs.length) {
                factoryNamedArgs[param.name] = factoryArgs[i];    
            }
            
        });

        var scope = walker.invokeFunctionExpression(def, factoryNamedArgs);
        
        type = scope.returnType;
        
        
        if (name) {
            /*
             * Register any anonymous classes
             */
            scope.forEachLocalVar(function(prop) {
                var varName = prop.name, 
                    varType = prop.type;
                
                
                if (varType && varType !== scope.returnType && varType.isJavaScriptFunction() && !varType.raptorName && varType.hasProperty("prototype")) {
                    var varComment = varType.getComment();

                    var innerSymbolName = name + "/" + varName;
                    if (!walker.getSymbols().hasSymbol(innerSymbolName)) {
                        varType.setName(innerSymbolName);
                        varType.setLabel(label + "/" + varName);
                        varType.extension = extension;
                        varType.setAnonymous(true);
                        
                        if (varComment && varComment.hasTag("name")) {
                            varType.setLabel(varComment.getTagValue("name"));
                        }

                        walker.getSymbols().addSymbol(innerSymbolName, varType);    
                    }
                    
                }
            }, this);
        }
    }

    
    if (type) {
        if (type.isJavaScriptFunction() && !isModule) {
            if (!type.hasProperty("prototype")) {
                type.setProperty({ //Make it clear that this a class and not just a regular function
                    name: "prototype",
                    type: new Type()
                }); 
            }
        }

        if (!type.isJavaScriptFunction() && isClass) {
            /*
             * The object being defined is a class defined using
             * define.Class, but the class definition object
             * is an object. We need to convert it to a
             * function type to make it clear that it is a 
             * class
             */
            var initProp = type.getProperty("init"),
                classType;
            
            if (initProp) {
                classType = initProp.type;
                if (initProp.comment) {
                    classType.setComment(initProp.comment);
                }    
            }
            else {
                classType = new Type("function");
            }
            
            
            var protoType = new Type("object");
            classType.setProperty({
                name: "prototype",
                type: protoType
            });

            type.forEachProperty(function(prop) {
                if (prop.name === 'init' && prop.type.isJavaScriptFunction()) {
                    prop.type.forEachFunctionParam(function(ctorParam) {
                        classType.addFunctionParam(ctorParam);
                    }, this);
                }
                else {
                    protoType.setProperty(prop);
                }
            });
            
            type = classType;
        }

        if (node.comment) {
            //Attach the comment or the main node to the type
            type.raptorDefineComment = node.comment;
            
            if (extension) {
                type.extension = extension;
            }
            
        }

        if (modifiers) {
            type.superclassName = modifiers.superclass;
            type.raptorModifiers = modifiers;
        }
        
        type.setName(name);
        type.raptorName = name;
        type.raptorDefineMethod = methodName;
        if (isModule) {
            type.raptorType = 'module';
        }
        else if (type.isJavaScriptFunction()) {
            type.raptorType = 'class';
        }
        else {
            if (methodName === 'define.Class') {
                type.raptorType = 'class';
            }
            else {
                type.raptorType = 'module';
            }
        }

        if (name) {
            walker.getSymbols().addSymbol(name, type);
        } 


        type.label = label;

        if (type && !(type instanceof Type)) {
            throw new Error('Invalid type being returned: ' + type);
        }
        
        //TODO: Handle enums and mixins
        
    }
    
    return type;
};
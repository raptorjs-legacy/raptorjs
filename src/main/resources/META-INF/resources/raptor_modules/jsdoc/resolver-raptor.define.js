var Type = raptor.require("jsdoc.Type");

var logger = raptor.require('logging').logger('resolver-raptor.define');

module.exports = function(methodName, node, walker, isClass) {
            
    var name = null,
        args = node['arguments'],
        modifiers = null,
        def = null,
        type = null,
        extension = null;
    
    if (node.comment) {
        if (node.comment.hasTag("extension")) {
            extension = node.comment.getTagValue("extension");
        }
        
    }
    
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
                if (extension) {
                    name += "_" + extension;
                }
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
        logger.warn('Invalid args to "' + methodName + '". Definition argument not found. Args: ' + walker.argsToString(args));
    }
    else if (def.type === 'FunctionExpression') {
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
                
                
                if (varType && varType !== scope.returnType && varType.isJavaScriptFunction() && !varType.raptorName && varType.hasProperty("prototype")) {
                    var innerSymbolName = name + "." + varName;
                    if (!walker.getSymbols().hasSymbol(innerSymbolName)) {
                        varType.setName(varName);
                        varType.setAnonymous(true);
                        walker.getSymbols().addSymbol(innerSymbolName, varType);    
                    }
                    
                }
            }, this);
        }
    }
    else if (def.type === 'ObjectExpression') {
        type = walker.resolveType(def);
    }
    
    if (type) {
        type.label = name;

        
        if (node.comment) {
            //Attach the comment or the main node to the type
            type.raptorDefineComment = node.comment;
            
            if (extension) {
                type.extension = extension;
            }
            
        }

        if (type.extension) {
            type.label += " (" + type.extension + " Extension)";
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
         
        if (type.isJavaScriptFunction()) {
            if (!type.hasProperty("prototype")) {
                type.setProperty({ //Make it clear that this a class and not just a regular function
                    name: "prototype",
                    type: new Type()
                }); 
            }
        }
        type.setName(name);
        type.raptorName = name;
        type.raptorDefineMethod = methodName;
        type.raptorType = methodName === 'raptor.defineMixin' ? "mixin" : type.isJavaScriptFunction() ? "class" : "module";
        
        if (name) {
            walker.getSymbols().addSymbol(name, type);
        } 
        
        
        if (type && !(type instanceof Type)) {
            throw raptor.createError(new Error('Invalid type being returned: ' + type));
        }
        
        //TODO: Handle enums and mixins
        
    }
    
    return type;
}
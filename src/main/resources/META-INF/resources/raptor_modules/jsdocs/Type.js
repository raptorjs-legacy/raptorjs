raptor.define(
    "jsdocs.Type",
    function(raptor) {
        "use strict";
        
        var INDENT = "  ";
        
        var Type = function(jsType) {
            this.properties = {};
            this.parentScope = null;
            this.functionParamNames = null;
            this.localVarNames = {};
            this.scope = null;
            this.javaScriptType = jsType;
            this.comment = null;
            
            this.instanceType = null;
        };
        
        Type.prototype = {
            hasComment: function() {
                return this.comment != null;
            },
            
            setJavaScriptType: function(jsType) {
                this.javaScriptType = jsType;
            },
            
            setFunctionParamNames: function(paramNames) {
                this.functionParamNames = paramNames;
            },
            
            getFunctionParamNames: function() {
                return this.functionParamNames;
            },
            
            getJavaScriptType: function() {
                return this.javaScriptType;
            },
            
            
            isJavaScriptFunction: function() {
                return this.javaScriptType === "function";
            },
            
            isJavaScriptObject: function() {
                return this.javaScriptType === "object";
            },
            
            isJavaScriptBoolean: function() {
                return this.javaScriptType === "boolean";
            },
            
            isJavaScriptNumber: function() {
                return this.javaScriptType === "number";
            },
            
            isJavaScriptString: function() {
                return this.javaScriptType === "string";
            },
            
            hasProperties: function() {
                return Object.keys(this.properties).length > 0;
            },
            
            hasProperty: function(name) {
                return this.properties.hasOwnProperty(name);
            },
            
            getProperty: function(name) {
                return this.properties[name];
            },
            
            getPropertyType: function(name) {
                var prop = this.properties[name];
                return prop ? prop.type : null;
            },
            
            getInstanceType: function() {
                return this.instanceType || (this.instanceType = new Type("this"));
            },
            
            setInstanceProperty: function(name, type, comment) {
                this.getInstanceType().setProperty(name, type, comment);
            },
            
            setProperty: function(name, type, comment) {
                if (!(type instanceof Type)) {
                    throw raptor.createError(new Error('Invalid property type for "' + name + '": ' + type));
                }
                var currentProperty = this.properties[name];
                if (currentProperty) {
                    if (!currentProperty.comment) {
                        currentProperty.comment = comment;
                    }
                    
                    if (type.instanceType) {
                        type.getInstanceType().forEachProperty(function(prop) {
                            currentProperty.type.setInstanceProperty(prop.name, prop.type, prop.comment);
                        }, this);
                    }
                }
                else {
                    this.properties[name] = {
                        name: name,
                        type: type,
                        comment: comment
                    };
                }
            },
            
            addProperties: function(props) {
                raptor.forEachEntry(props, function(name, def) {
                    var type;
                    if (def instanceof Type) {
                        type = def;
                    }
                    else if (typeof def === 'object') {
                        type = new Type("object");
                    }
                    else if (typeof def === 'function') {
                        type = new Type("function");
                        type.resolver = def;
                    }
                    else {
                        throw raptor.createError(new Error("Invalid type: " + type));
                    }
                    
                    this.setProperty(name, type);
                    
                    if (typeof def === 'object') {
                        type.addProperties(def);
                    }
                }, this);
            },
            
            forEachProperty: function(callback, thisObj) {
                raptor.forEachEntry(this.properties, function(name, prop) {
                    callback.call(thisObj, prop);
                }, this);
            },
            
            resolveVar: function(name) {
                
                if (name == null) {
                    throw raptor.createError(new Error("Variable name is required"));
                }
                
                var type = this.getPropertyType(name);
                if (!type && this.parentScope) {
                    return this.parentScope.resolveVar(name);
                }
                
                return type;
            },
            
            addLocalVariable: function(name, type, comment) {
                this.localVarNames[name] = true;
                
                if (type) {
                    type.setScope(this); //Associate the local variable with the scope
                }
                
                this.setProperty(name, type, comment);
            },
            
            isLocalVariable: function(name) {
                return this.localVarNames.hasOwnProperty(name);
            },
            
            setParentScope: function(parentScope) {
                this.parentScope = parentScope;
            },
            
            forEachLocalVar: function(callback, thisObj) {
                Object.keys(this.localVarNames).forEach(function(varName) {
                    var prop = this.getProperty(varName);
                    callback.call(thisObj, prop);
                }, this);
            },
            
            toString: function(indent) {
                
                var typeStr;
                
                var indentComment = function(comment, indent) {
                    return indent + comment.getText().replace(/\n\s*/g,"\n" + indent + " ") + '\n';
                };
                
                
                if (indent == null) {
                    indent = "";
                }
                
                
                
                var keys =  Object.keys(this.properties),
                    propsStr = "",
                    paramsStr = "",
                    instancePropsStr = "",
                    commentStr = '';
                
                if (this.getComment()) {
                    commentStr = '\n' + indentComment(this.getComment(), indent) ;
                    typeStr = indent + this.javaScriptType;
                }
                else {
                    typeStr = this.javaScriptType;
                }
                
                
                if (keys.length) {
                    var propsLabel = this.javaScriptType === 'this' ? 'instance properties: ' : '';
                    
                    propsStr = "\n" + indent + INDENT + propsLabel + "{\n" + keys.map(function(key) {
                        var prop = this.properties[key],
                            commentStr = '';
                        if (prop.comment) {
                            commentStr = indentComment(prop.comment, indent + INDENT + INDENT);
                        }
                        return commentStr + indent + INDENT + INDENT + JSON.stringify(key) + ": " + prop.type.toString(indent + INDENT + INDENT);
                    }, this).join(",\n\n") + "\n" + indent + INDENT + "}";
                }
                
                if (this.javaScriptType === 'this') {
                    return propsStr;
                }
                
                if (this.javaScriptType === 'function') {
                    var params = this.getFunctionParamNames() || [];
                    paramsStr = "(" + params.join(", ") + ")";
                }
                
                if (this.instanceType) {
                    instancePropsStr = this.instanceType.toString(indent);
                }
                
                
                
                return commentStr + typeStr + paramsStr + instancePropsStr + propsStr;
            },
            
            getType: function() {
                return "object";
            },
            
            setScope: function(scope) {
                this.scope = scope;
            },
            
            getScope: function() {
                return this.scope;
            },
            
            setComment: function(comment) {
                this.comment = comment;
            },
            
            getComment: function() {
                return this.comment;
            }
        };
        
        return Type;
        
        
    });
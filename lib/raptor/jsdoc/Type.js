define(
    "raptor/jsdoc/Type",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var INDENT = "  ",
            Comment = require('raptor/jsdoc/Comment'),
            shortRegExp = /[\.\/]([^\.\/]*)$/;
        
        var Type = function(jsType, name) {
            this.properties = {};
            this.anonymous = false;
            this.functionParamNames = null; //Only valid when this type is a function
            this.functionParamsByName = null;
            this.parentScope = null; //Only valid when this type is a function scope
            this.localVarNames = {}; //Only valid when this type is a function scope
            this.javaScriptType = jsType; //The primitive type of the JavaScript object. One of: function, object, boolean, number and string
            this.comment = null; //The jsdoc.Comment associated with the type
            this.instanceType = null; //Only valid when this type is a function
            this.name = name; //The name to use for display
            this.superclassName = null; //The symbol name of the superclass
            this.extension = null;
        };
        
        Type.prototype = {
                
            hasCommentTag: function(name) {
                return this.comment && this.comment.hasTag(name);
            },
            
            getCommentTag: function(name) {
                return (this.comment && this.comment.getTag(name)) || [];
            },
            
            getCommentTags: function(name) {
                return (this.comment && this.comment.getTags(name)) || [];
            },
            
            getCommentTagValue: function(name) {
                var tag = this.comment && this.comment.getTag(name); 
                return tag ? tag.getValue() : null;
            },
            
            getLabel: function(includeExt) {
                var label = (this.hasCommentTag("label") ? this.getCommentTagValue("label") : null) || this.label || this.name;
                if (includeExt !== false && this.getExtension()) {
                    label += " (" + this.getExtension() + " Extension)";
                }
                return label;
            },

            getLabelNoExt: function(includeExt) {
                return this.getLabel(false);
            },
            
            getShortLabel: function() {
                var label = this.getLabel();
                shortRegExp.lastIndex = 0;
                var matches = shortRegExp.exec(label);
                if (matches) {
                    return matches[1];
                }
                else {
                    return label;
                }
            },

            getShortName: function() {
                var name = this.getName();
                var lastDot = name.lastIndexOf('.');
                return lastDot !== -1 ? name.substring(lastDot+1) : name;
            },

            addFunctionParam: function(param) {
                if (!this.functionParamNames) {
                    this.functionParamNames = [];
                    this.functionParamsByName = {};
                }

                var name = param.name;

                if (!name) {
                    throw raptor.createError(new Error("Invalid function param. Param name is required"));
                }
                

                this.functionParamNames.push(name);
                this.functionParamsByName[name] = param;
            },

            forEachFunctionParam: function(callback, thisObj, comment) {
                if (!this.functionParamNames) {
                    return;
                }

                var paramTagsByName = {};

                if (comment) {

                    var paramTags = comment.getTags("param");
                    paramTags.forEach(function(paramTag) {
                        paramTagsByName[paramTag.paramName] = paramTag;
                    });    
                }
                
                this.functionParamNames.forEach(function(paramName) {
                    var param = raptor.extend({}, this.functionParamsByName[paramName]);
                    var paramTag = paramTagsByName[paramName];
                    if (paramTag) {
                        param.desc = paramTag.paramDesc;
                        param.type = paramTag.paramType || param.type;
                    }
                    callback.call(thisObj, param);
                }, this);
            },

            getFunctionParamNames: function() {
                return this.functionParamNames;
            },

            forEachFunctionParamName: function(callback, thisObj) {
                if (!this.functionParamNames) {
                    return;
                }

                this.functionParamNames.forEach(callback, thisObj);
            },
            
            getExtension: function() {
                return (this.hasCommentTag("extension") ? this.getCommentTagValue("extension") : null) || this.extension;
            },
            
            hasComment: function() {
                return this.comment != null;
            },
            
            setJavaScriptType: function(jsType) {
                this.javaScriptType = jsType;
            },
            
            getJavaScriptType: function() {
                return this.javaScriptType;
            },
            
            
            isJavaScriptFunction: function() {
                return this.javaScriptType === "function" || this.hasCommentTag("function");
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
            
            getPropertyNames: function() {
                return Object.keys(this.properties);
            },
            
            getPropertyType: function(name) {
                var prop = this.properties[name];
                return prop ? prop.type : null;
            },
            
            getInstanceType: function() {
                return this.instanceType || (this.instanceType = new Type("this"));
            },
            
            setInstanceProperty: function(prop) {
                this.getInstanceType().setProperty(prop);
            },

            forEachInstanceProperty: function(callback, thisObj) {
                if (this.instanceType) {
                    this.instanceType.forEachProperty(callback, thisObj);
                }
            },
            
            setProperty: function(prop) {
                if (typeof prop !== 'object') {
                    throw raptor.createError(new Error('"prop" argument should be an object'));
                }

                var name = prop.name;
                if (name == null) {
                    throw raptor.createError(new Error('"name" property is required'));
                }

                var currentProperty = this.properties[name];
                if (currentProperty) {
                    raptor.forEachEntry(prop, function(name, value) {
                        if (!currentProperty[name]) {
                            currentProperty[name] = value;
                        }
                        else if (name === 'type') {
                            if (value && value.instanceType) { //See if the duplicate property has instance properties
                                /*
                                 * Attach the instance properties from the duplicate property to the existing type
                                 */
                                value.getInstanceType().forEachProperty(function(prop) {
                                    currentProperty.type.setInstanceProperty(prop);
                                }, this);
                            }
                        }
                    }, this);
                    

                    
                }
                else {
                    prop.parentType = this;
                    this.properties[name] = prop;
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
                    
                    this.setProperty({
                        name: name,
                        type: type
                    });
                    
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
                this.setProperty({
                    name: name,
                    type: type,
                    comment: comment
                });
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
            
            toString: function(indent, context) {
                
                var typeStr;
                
                var indentComment = function(comment, indent) {
                    return indent + comment.getText().replace(/\n\s*/g,"\n" + indent + " ") + '\n';
                };
                
                
                if (indent == null) {
                    indent = "";
                }
                
                if (context == null) {
                    context = {};
                }
                
                
                if (this.name) {
                    if (context[this.name]) {
                        return indent + "(circular type: " + this.name + ")";
                    }
                    
                    context[this.name] = true;
                }
                
                
                
                
                
                var keys =  Object.keys(this.properties),
                    propsStr = "",
                    paramsStr = "",
                    instancePropsStr = "",
                    commentStr = '';
                
                if (this.getComment()) {
                    commentStr = '\n' + indentComment(this.getComment(), indent) + indent;
                }
                
                typeStr = this.name ? '[' + this.name + ']' + " " + this.javaScriptType : this.javaScriptType;
                
                
                if (keys.length) {
                    var propsLabel = this.javaScriptType === 'this' ? 'instance properties: ' : '';
                    
                    propsStr = "\n" + indent + INDENT + propsLabel + "{\n" + keys.map(function(key) {
                        var prop = this.properties[key],
                            commentStr = '';
                        if (prop.comment) {
                            commentStr = indentComment(prop.comment, indent + INDENT + INDENT);
                        }
                        return commentStr + indent + INDENT + INDENT + JSON.stringify(key);// + ": " + (prop.type ? prop.type.toString(indent + INDENT + INDENT, context) : "(unknown type)");
                    }, this).join(",\n\n") + "\n" + indent + INDENT + "}";
                }
                
                if (this.javaScriptType === 'this') {
                    return propsStr;
                }
                
                if (this.javaScriptType === 'function') {
                    var params = this.functionParamNames || [];
                    paramsStr = "(" + params.join(", ") + ")";
                }
                
                if (this.instanceType) {
                    instancePropsStr = this.instanceType.toString(indent, context);
                }
                
                
                
                return commentStr + typeStr + paramsStr + instancePropsStr + propsStr;
            },
            
            getType: function() {
                return "object";
            },
            
            setComment: function(comment) {
                this.comment = comment;
            },
            
            getComment: function() {
                return this.comment;
            },
            
            setSuperclassName: function(superclassName) {
                this.superclassName = superclassName;
            },
            
            getSuperclassName: function() {
                return this.superclassName || this.getCommentTagValue("superclass");
            },
            
            setAnonymous: function(anonymous) {
                this.anonymous = anonymous;
            },
            
            isAnonymous: function() {
                return this.anonymous;
            },
            
            setName: function(name) {
                this.name = name;
            },
            
            getName: function() {
                return this.name;
            },
            
            isClass: function() {
                return this.isJavaScriptFunction() && this.hasProperty("prototype");
            },
            
            isObject: function() {
                return this.isJavaScriptObject();
            },
            
            addType: function(type) {
                //Currently not implemented... could be used to track a property/variable with multiple assigned types
            },
            
            getExtensionFor: function() {
                return this.hasCommentTag("extensionFor") ? this.getCommentTagValue("extensionFor") : this.extensionFor;
            },

            setLabel: function(label) {
                this.label = label;
            }
            
            
        };
        
        return Type;
        
        
    });
raptor.defineClass(
    "templating.taglibs.core.TagHandlerNode",
    'templating.compiler.Node',
    function(raptor) {
        var extend = raptor.extend,
            forEach = raptor.forEach,
            stringify = raptor.require('json.stringify').stringify,
            forEachEntry = raptor.forEachEntry,
            Expression = raptor.require('templating.compiler.Expression'),
            addHandlerVar = function(template, handlerClass) {
                var handlerVars = template._handlerVars;
                
                if (!handlerVars) {
                    template._handlerVars = handlerVars = {}; 
                }
                
                var handlerVar = handlerVars[handlerClass];
                if (!handlerVar) {
                    handlerVars[handlerClass] = handlerVar = handlerClass.replace(/[.\-]/g, '_');
                    template.addStaticJavaScriptVar(handlerVar, template.getStaticHelperFunction("getHandler", "h") + "(" + stringify(handlerClass) + ")");
                }
                
                return handlerVar;
                
            },
            getPropsStr = function(props) {
                var propsStr,
                propsArray = [];
            
                if (props) {
                    forEachEntry(props, function(name, value) {
                        if (value instanceof Expression) {
                            propsArray.push(stringify(name) + ":" + value.expression);
                        }
                        else if (typeof value === 'string') {
                            propsArray.push(stringify(name) + ":" + stringify(value));
                        }
                        else {
                            propsArray.push(stringify(name) + ":" + value);
                        }
                    });
                    
                    if (propsArray.length) {
                        return "{" + propsArray.join(',') + "}";
                    }
                    else {
                        return "{}";
                    }
                }
                else {
                    return "{}";
                }
            };
        
        var TagHandlerNode = function(tagDef) {
            if (!this.nodeType) {
                TagHandlerNode.superclass.constructor.call(this);
            }
            this.tagDef = tagDef;
        };
        
        TagHandlerNode.convertNode = function(node, tagDef) {
            extend(node, TagHandlerNode.prototype);
            TagHandlerNode.call(node, tagDef);
        };
        
        TagHandlerNode.prototype = {
            
            doGenerateCode: function(template) {
                
                
                var handlerVar = addHandlerVar(template, this.tagDef.handlerClass);

                template.addJavaScriptCode(template.getContextHelperFunction("invokeHandler", "h") + '(' +
                        handlerVar + ',');
                
                
                forEach(this.tagDef.importedVariables, function(importedVariable) {
                    this.setProperty(null, importedVariable.propertyName, new Expression(importedVariable.expression));
                }, this);
                 
                
                template.addJavaScriptCode(getPropsStr(this.getProperties()) + ",");
                
                if (this.hasChildren()) {
                    var bodyParams = [];
                    forEach(this.tagDef.nestedVariables, function(v) {
                        bodyParams.push(v.name);
                    });
                    
                    template.addJavaScriptCode("function(" + bodyParams.join(",") + "){");
                    
                    this.generateCodeForChildren(template);
                    
                    template.addJavaScriptCode("}");
                }
                else {
                    template.addJavaScriptCode("null");
                }
                

                var propertyNamespaces = this.getPropertyNamespaces();
                var namespacedProps = [];
                
                forEach(propertyNamespaces, function(uri) {
                    if (uri !== "") {
                        var props = this.getPropertiesNS(uri);
                        namespacedProps.push('"' + uri + '":' + getPropsStr(props));
                    }
                }, this);
                
                if (namespacedProps.length) {
                    template.addJavaScriptCode(",{");
                    template.addJavaScriptCode(namespacedProps.join(","));
                    template.addJavaScriptCode("}");
                }
                
                template.addJavaScriptCode(");");
            }
        };
        
        
        
        return TagHandlerNode;
    });
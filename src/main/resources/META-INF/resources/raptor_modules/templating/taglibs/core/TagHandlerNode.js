/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

raptor.defineClass(
    "templating.taglibs.core.TagHandlerNode",
    'templating.compiler.Node',
    function(raptor) {
        "use strict";
        
        var extend = raptor.extend,
            objects = raptor.require('objects'),
            forEach = raptor.forEach,
            stringify = raptor.require('json.stringify').stringify,
            forEachEntry = raptor.forEachEntry,
            Expression = raptor.require('templating.compiler.Expression'),
            addHandlerVar = function(template, handlerClass) {
                var handlerVars = template._handlerVars || (template._handlerVars = {});
                
                var handlerVar = handlerVars[handlerClass];
                if (!handlerVar) {
                    handlerVars[handlerClass] = handlerVar = handlerClass.replace(/[.\-]/g, '_');
                    template.addStaticVar(handlerVar, template.getStaticHelperFunction("getTagHandler", "t") + "(" + stringify(handlerClass) + ")");
                }
                
                return handlerVar;
                
            },
            getPropsStr = function(props, template) {
                var propsArray = [];
            
                if (props) {
                    forEachEntry(props, function(name, value) {
                        if (value instanceof Expression) {
                            propsArray.push(template.indentStr(1) + stringify(name) + ":" + value.expression);
                        }
                        else if (typeof value === 'string') {
                            propsArray.push(template.indentStr(1) + stringify(name) + ":" + stringify(value));
                        }
                        else {
                            propsArray.push(template.indentStr(1) + stringify(name) + ":" + value);
                        }
                    });
                    
                    if (propsArray.length) {
                        return "{\n" + propsArray.join(',\n') + "\n" + template.indentStr() + "}";
                    }
                    else {
                        return "{}";
                    }
                }
                else {
                    return "{}";
                }
            };
        
        var TagHandlerNode = function(tag) {
            if (!this.nodeType) {
                TagHandlerNode.superclass.constructor.call(this);
            }
            this.tag = tag;
            this.dynamicAttributes = null;
        };
        
        TagHandlerNode.convertNode = function(node, tag) {
            extend(node, TagHandlerNode.prototype);
            TagHandlerNode.call(node, tag);
        };
        
        TagHandlerNode.prototype = {
            
            addDynamicAttribute: function(name, value) {
                if (!this.dynamicAttributes) {
                    this.dynamicAttributes = {};
                }
                
                this.dynamicAttributes[name] = value;
            },
            
            doGenerateCode: function(template) {
                
                /*
                    context.t(
                        handler, 
                        props, 
                        bodyFunc, 
                        dynamicAttributes, 
                        namespacedProps)
                */
                
                ///////////////////
                
                
                var handlerVar = addHandlerVar(template, this.tag.handlerClass);
                
                forEach(this.tag.importedVariables, function(importedVariable) {
                    this.setProperty(importedVariable.targetProperty, new Expression(importedVariable.expression));
                }, this);
                
                
                var namespacedProps = raptor.extend({}, this.getPropertiesByNS());
                delete namespacedProps[''];
                var hasNamespacedProps = !objects.isEmpty(namespacedProps);
                
                ///////////
                template.contextMethodCall("t", function() {
                    template
                        .code("\n")
                        .indent(function() {
                            template
                                .line(handlerVar + ',')
                                .indent().code(getPropsStr(this.getProperties(), template));
                            
                            if (this.hasChildren()) {
                                var bodyParams = [];
                                
                                forEach(this.tag.nestedVariables, function(v) {
                                    bodyParams.push(v.name);
                                });
                                
                                template
                                    .code(',\n')
                                    .line("function(" + bodyParams.join(",") + ") {") 
                                    .indent(function() {
                                        this.generateCodeForChildren(template);    
                                    }, this)
                                    .indent()
                                    .code('}');
                            }
                            else {
                                if (hasNamespacedProps || this.dynamicAttributes) {
                                    template
                                        .code(",\n")
                                        .indent().code("null");
                                }
                            }
                            
                            if (this.dynamicAttributes) {
                                template
                                    .code(",\n")
                                    .indent().code(getPropsStr(this.dynamicAttributes, template));
                            }
                            else {
                                if (hasNamespacedProps) {
                                    template
                                        .code(",\n")
                                        .indent().code("null");
                                }
                            }
                            
                            if (hasNamespacedProps) {
                                template
                                    .code(",\n")
                                    .line("{")
                                    .indent(function() {
                                        var first = true;
                                        forEachEntry(namespacedProps, function(uri, props) {
                                            if (!first) {
                                                template.code(',\n');
                                            }
                                            template.code(template.indentStr() + '"' + uri + '": ' + getPropsStr(props, template));
                                            first = false;
                                            
                                        });                                        
                                    })
                                    .indent()
                                    .code("}");
                            }
                            
                        }, this);
                }, this);
                
                

            }
        };
        
        
        
        return TagHandlerNode;
    });
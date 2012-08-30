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
                var handlerVars = template._handlerVars;
                
                if (!handlerVars) {
                    template._handlerVars = handlerVars = {}; 
                }
                
                var handlerVar = handlerVars[handlerClass];
                if (!handlerVar) {
                    handlerVars[handlerClass] = handlerVar = handlerClass.replace(/[.\-]/g, '_');
                    template.addStaticVar(handlerVar, template.getStaticHelperFunction("getTagHandler", "t") + "(" + stringify(handlerClass) + ")");
                }
                
                return handlerVar;
                
            },
            getPropsStr = function(props, template) {
                var propsStr,
                propsArray = [];
            
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
        
        var TagHandlerNode = function(tagDef) {
            if (!this.nodeType) {
                TagHandlerNode.superclass.constructor.call(this);
            }
            this.tagDef = tagDef;
            this.dynamicAttributes = null;
        };
        
        TagHandlerNode.convertNode = function(node, tagDef) {
            extend(node, TagHandlerNode.prototype);
            TagHandlerNode.call(node, tagDef);
        };
        
        TagHandlerNode.prototype = {
            
            addDynamicAttribute: function(name, value) {
                if (!this.dynamicAttributes) {
                    this.dynamicAttributes = {};
                }
                
                this.dynamicAttributes[name] = value;
            },
            
            doGenerateCode: function(template) {
                
                
                var handlerVar = addHandlerVar(template, this.tagDef.handlerClass);

                forEach(this.tagDef.importedVariables, function(importedVariable) {
                    this.setProperty(importedVariable.propertyName, new Expression(importedVariable.expression));
                }, this);
                
                var bodyParams;
                
                if (this.hasChildren()) {
                    bodyParams = [];
                    
                    forEach(this.tagDef.nestedVariables, function(v) {
                        bodyParams.push(v.name);
                    });
                }
                
                var propertyNamespaces = this.getPropertyNamespaces();
                var namespacedProps = [];
                
                forEach(propertyNamespaces, function(uri) {
                    if (uri !== "") {
                        namespacedProps.push({name: uri, props: this.getPropertiesNS(uri)});
                    }
                }, this);
                
                if (this.dynamicAttributes) {
                    namespacedProps.push({name: '*', props: this.dynamicAttributes});
                }
                
                ///////////
                
                template
                    .statement('context.t(')
                    .indent(function() {
                        template
                            .line(handlerVar + ',')
                            .indent().code(getPropsStr(this.getProperties(), template));
                        
                        if (this.hasChildren()) {
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
                            if (namespacedProps.length) {
                                template
                                    .indent().code(",\n")
                                    .indent().code("null");
                            }
                        }
                        
                        if (namespacedProps.length) {
                            template
                                .code(",\n")
                                .line("{")
                                .indent(function() {
                                    
                                    template.code(
                                        namespacedProps.map(function(entry) {
                                            return '"' + entry.name + '": ' + getPropsStr(entry.props, template)
                                        }, this)
                                        .join('n,'));
                                    
                                })
                                .indent()
                                .code("}");
                        }
                        
                    }, this)
                    .code(');\n');

            }
        };
        
        
        
        return TagHandlerNode;
    });
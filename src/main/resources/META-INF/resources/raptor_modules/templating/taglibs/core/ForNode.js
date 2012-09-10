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
    'templating.taglibs.core.ForNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var errors = raptor.errors,
            forEachRegEx = /^(.+)\s+in\s+(.+)$/,
            stringify = raptor.require("json.stringify").stringify,
            parseForEach = function(value) {
                var match = value.match(forEachRegEx);
                if (!match) {
                    throw new Error('Invalid each attribute of "' + value + '"');
                }
                return {
                    "var": match[1],
                    "in": match[2]
                };
            };
        
        var ForNode = function(props) {
            ForNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);    
            }
        };

        ForNode.prototype = {
            doGenerateCode: function(template) {
                var each = this.getProperty("each"),
                    separator = this.getProperty("separator"),
                    statusVar = this.getProperty("status-var") || this.getProperty("varStatus");
                
                if (!each) {
                    this.addError('"each" attribute is required');
                    this.generateCodeForChildren(template);
                    return;
                }
                
                var parts;
                try
                {
                    parts = parseForEach(each);
                }
                catch(e) {
                    this.addError(e.message);
                    this.generateCodeForChildren(template);
                    return;
                }
                
                var items = template.makeExpression(parts["in"]);
                var varName = parts["var"];
                if (separator && !statusVar) {
                    statusVar = "__loop";
                }
                
                var forEachParams;
                if (statusVar) {
                    forEachParams = [varName, statusVar];
                    
                    
                    template
                        .statement(template.getStaticHelperFunction("forEachWithStatusVar", "fv") + '(' + items + ', function(' + forEachParams.join(",") + ') {') 
                        .indent(function() {
                            this.generateCodeForChildren(template);
                            if (separator) {
                                template
                                    .statement("if (!" + statusVar + ".isLast()) {")
                                    .indent(function() {
                                        template.write(template.isExpression(separator) ? separator.getExpression() : stringify(separator));    
                                    }, this)
                                    .line('}');
                            }
                        }, this)
                        .line('});');
                }
                else {
                    if (this.getProperty('for-loop') === true) {
                        forEachParams = ["__array", "__index", "__length", varName];
                        
                        template
                            .statement(template.getStaticHelperFunction("forLoop", "fl") + '(' + items + ', function(' + forEachParams.join(",") + ') {')
                            .indent(function() {
                                template
                                    .statement('for (;__index<__length;__index++) {') 
                                    .indent(function() {
                                        template.statement(varName + '=__array[__index];');
                                        this.generateCodeForChildren(template);    
                                    }, this)
                                    .line('}');
                                
                                this.generateCodeForChildren(template);
                            }, this)
                            .line('});');
                    }
                    else {
                        forEachParams = [varName];
                        
                        template
                            .statement(template.getStaticHelperFunction("forEach", "f") + '(' + items + ', function(' + forEachParams.join(",") + ') {') 
                            .indent(function() {
                                this.generateCodeForChildren(template);    
                            }, this)
                            .line('});');
                    }
                }
                
                
            }
        
        };
        
        return ForNode;
    });
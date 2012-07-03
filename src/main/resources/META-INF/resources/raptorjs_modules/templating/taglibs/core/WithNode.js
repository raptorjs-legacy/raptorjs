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
    'templating.taglibs.core.WithNode',
    'templating.compiler.Node',
    function(raptor) {
        "use strict";
        
        var errors = raptor.errors,
            AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter');
        
        var WithNode = function(props) {
            WithNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        WithNode.prototype = {
            
            doGenerateCode: function(template) {
                var vars = this.getProperty("vars");
                
                if (!vars) {
                    throw template.compiler.syntaxError('"vars" attribute is required');
                }
                
                var withVars = AttributeSplitter.parse(
                        vars, 
                        {
                            "*": {
                                type: "expression"
                            }
                        },
                        {
                            ordered: true
                        });
                
                var varDefs = [];
                
                raptor.forEach(withVars, function(withVar) {
                    varDefs.push(withVar.name + (withVar.value ? ("=" + withVar.value) : ""));
                });
                
                
                template.addJavaScriptCode('(function() {');
                template.addJavaScriptCode('var ' + varDefs.join(",") + ";");
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}());');
            }
            
        };
        
        return WithNode;
    });
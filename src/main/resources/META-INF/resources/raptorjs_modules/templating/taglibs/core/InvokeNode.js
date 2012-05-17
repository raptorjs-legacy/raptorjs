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
    'templating.taglibs.core.InvokeNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var errors = raptor.errors,
            forEach = raptor.forEach;
        
        var InvokeNode = function(props) {
            InvokeNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        InvokeNode.prototype = {

            doGenerateCode: function(template) {
                
                var func = this.getProperty("function");
                
                if (!func) {
                    errors.throwError(new Error('"function" attribute is required'));
                }
                
                if (func.indexOf('(') === -1) {
                    var definedFunctions = template.getAttribute("core:definedFunctions");
                    if (!definedFunctions) {
                        raptor.throwError(new Error('Function with name "' + func + '" not defined using <c:define>.'));
                    }
                    var funcDef = definedFunctions[func];
                    if (!funcDef) {
                        raptor.throwError(new Error('Function with name "' + func + '" not defined using <c:define>.'));
                    }
                    var params = funcDef.params || [];
                    
                    var argParts = [];
                    
                    var validParamsLookup = {};
                    /*
                     * Loop over the defined parameters to figure out the names of allowed parameters and add them to a lookup
                     */
                    forEach(params, function(param) {
                        validParamsLookup[param] = true;
                    }, this);
                    
                    /*
                     * VALIDATION:
                     * Loop over all of the provided attributes and make sure they are allowed 
                     */
                    this.forEachProperty(function(name, value) {
                        if (name === 'function') {
                            return;
                        }
                        
                        if (!validParamsLookup[name]) {
                            raptor.throwError(new Error('Parameter with name "' + name + '" not supported for function with name "' + func + '". Allowed parameters: ' + params.join(", ")));
                        }
                    }, this);
                    
                    /*
                     * One more pass to build the argument list
                     */
                    forEach(params, function(param) {
                        validParamsLookup[param] = true;
                        var arg = this.getAttribute(param);
                        if (arg == null) {
                            argParts.push("undefined");
                        }
                        else {
                            argParts.push(this.getProperty(param));
                        }
                    }, this);
                    
                    template.addWrite(func + "(" + argParts.join(",") + ")");
                }
                else {
                    template.addJavaScriptCode(func + ";");
                }
            }
            
        };
        
        return InvokeNode;
    });
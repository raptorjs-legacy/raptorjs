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
    "templating.taglibs.core.TemplateNode",
    'templating.compiler.Node',
    function() {
        "use strict";

        var forEach = raptor.forEach;
        
        var TemplateNode = function(props) {
            TemplateNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        TemplateNode.prototype = {
        
            doGenerateCode: function(template) {
                var name = this.getProperty("name"),
                    params = this.getProperty("params"),
                    addUriVar = function(uri) {
                        var uriVarName = uri.replace(/[^a-zA-Z0-9]+/g, '_');
                        if (!template.hasStaticVar(uriVarName)) {
                            template.addStaticVar(uriVarName, JSON.stringify(uri));
                        }
                        return uriVarName;
                    },
                    uriVarName;
                
                if (params) {
                    params = params.split(/\s*,\s*/g);
                    
                    forEach(params, function(param) {
                        template.addVar(param, "data." + param);
                    }, this);
                }
                else {
                    params = null;
                }
                
                this.forEachProperty(function(uri, name, value) {
                    if (!uri) {
                        uri = this.uri;
                    }
                    
                    if (name === 'functions') {
                        uriVarName = addUriVar(uri);
                        
                        forEach(value.split(/\s*,\s*/g), function(helper) {
                            var func = template.compiler.taglibs.getFunction(uri, helper);
                            if (!func) {
                                this.addError('Function with name "' + helper + '" not found in taglib "' + uri + '"');
                            }
                            else {
                                if (func.bindToContext === true) {
                                    template.addVar(helper, template.getContextHelperFunction("getContextHelper", "h")  + "(" + uriVarName + "," + JSON.stringify(helper) + ")");    
                                }
                                else {
                                    template.addStaticVar(helper, template.getStaticHelperFunction("getHelper", "h")  + "(" + uriVarName + "," + JSON.stringify(helper) + ")");
                                }    
                            }
                        }, this);
                    }
                }, this);

                
                if (!name && !template.compiler.options.templateName) {
                    this.addError('The "name" attribute is required for the ' + this.toString() + ' tag.');
                }
                
                template.setTemplateName(name);
                
                this.generateCodeForChildren(template);
            }
        };
        
        return TemplateNode;
    });
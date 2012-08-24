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
    'templating.taglibs.core.IncludeNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var errors = raptor.errors,
            stringify = raptor.require('json.stringify').stringify;
        
        var IncludeNode = function(props) {
            IncludeNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        IncludeNode.prototype = {
            doGenerateCode: function(template) {
                
                var templateName = this.getProperty("template"),
                    resourcePath;
                
                if (templateName) {
                    this.removeProperty("template");
                    
                    
                    var propParts = [];
                    
                    this.forEachPropertyNS('', function(name, value) {
                        propParts.push(stringify(name) + ": " + value);
                    }, this);
                    
                    var propsStr = "context.i(" + templateName + ",{" + propParts.join(",") + "});\n";
                    template.addJavaScriptCode(propsStr);
                }
                else if ((resourcePath = this.getAttribute("resource"))) {
                    var isStatic = this.getProperty("static") !== false;
                    if (isStatic) {
                        var resource = raptor.require('resources').findResource(resourcePath);
                        if (!resource.exists()) {
                            this.addError('"each" attribute is required');
                            return;
                        }
                        
                        template.addWrite(raptor.require('json.stringify').stringify(resource.readFully()));
                    }
                }
                else {
                    this.addError('"template" or "resource" attribute is required');
                }
            }
            
        };
        
        return IncludeNode;
    });
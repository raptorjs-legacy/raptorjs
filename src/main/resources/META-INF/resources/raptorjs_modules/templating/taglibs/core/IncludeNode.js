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
                
                var templateName = this.getProperty("template");
                this.removeProperty("template");
                
                if (!templateName) {
                    throw new Error('"template" attribute is required');
                }
                var propParts = [];
                
                this.forEachPropertyNS('', function(name, value) {
                    propParts.push(stringify(name) + ": " + value);
                }, this);
                
                var propsStr = template.getContextHelperFunction("include", "i") + "(" + templateName + ",{" + propParts.join(",") + "});";
                template.addJavaScriptCode(propsStr);
            }
            
        };
        
        return IncludeNode;
    });
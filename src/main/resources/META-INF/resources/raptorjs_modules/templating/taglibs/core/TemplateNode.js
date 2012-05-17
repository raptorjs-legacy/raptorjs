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
        
        var extend = raptor.extend,
            errors = raptor.errors;
        
        var TemplateNode = function(props) {
            TemplateNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        TemplateNode.prototype = {
        
            doGenerateCode: function(template) {
                var name = this.getProperty("name"),
                    params = this.getProperty("params");
                
                if (params) {
                    params = params.split(/\s*,\s*/g);
                }
                else {
                    params = null;
                }
                
                if (!name) {
                    raptor.throwError(new Error('The "name" attribute is required for the ' + this.toString() + ' tag.'));
                }
                
                template.setTemplateName(name);
                template.addTemplateParams(params);
                this.generateCodeForChildren(template);
            }
        };
        
        return TemplateNode;
    });
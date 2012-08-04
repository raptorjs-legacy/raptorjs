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
    'templating.taglibs.core.WhenNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var errors = raptor.errors;
        
        var WhenNode = function(props) {
            WhenNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        WhenNode.prototype = {
            
            doGenerateCode: function(template) {
                var test = this.getProperty("test");
                
                if (!test) {
                    console.error('WHEN NODE: ', this.properties);
                    this.addError('"test" attribute is required for ' + this.toString() + " tag.");
                }
                if (!this.firstWhen) {
                    template.addJavaScriptCode(' else ');                    
                }
                template.addJavaScriptCode('if (' + test + '){');
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}');
            }
            
        };
        
        return WhenNode;
    });
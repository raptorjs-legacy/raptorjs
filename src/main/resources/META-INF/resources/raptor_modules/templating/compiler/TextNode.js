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
    'templating.compiler.TextNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var TextNode = function(text) {
            TextNode.superclass.constructor.call(this, 'text');
            this.text = text;
        };
        
        TextNode.prototype = {
            doGenerateCode: function(template) {
                var text = this.text;
                if (text) {
                    var preserveWhitespace = template.isPreserveWhitespace() ||
                        (template.options.preserveWhitespace === true) ||
                        (template.options.preserveWhitespace && template.options.preserveWhitespace["*"]);
                    
                    if (!preserveWhitespace) {
                        text = this.text.replace(/(^\n\s*|\n\s*$)/g, "").replace(/\s+/g, " ");
                    }

                    template.addText(text);
                }
            },
            
            getText: function() {
                return this.text;
            },
            
            isTextNode: function() {
                return true;
            },
            
            isElementNode: function() {
                return false;
            },
            
            toString: function() {
                return "[text]";
            }
        };
        
        return TextNode;
    });
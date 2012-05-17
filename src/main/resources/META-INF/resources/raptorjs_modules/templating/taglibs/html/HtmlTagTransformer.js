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
    "templating.taglibs.html.HtmlTagTransformer",
    function() {

        return {
            
            process: function(node, compiler) {
                
                if (node.isElementNode()) {
                    var options = compiler.options || {};
                    var preserveWhitespace = compiler.options.preserveWhitespace || {};
                    var allowSelfClosing = compiler.options.allowSelfClosing || {};
                    var startTagOnly = compiler.options.startTagOnly || {};
                    
                    var lookupKey = node.uri ? node.uri + ":" + node.localName : node.localName;
                    if (preserveWhitespace[lookupKey] === true) {
                        node.setPreserveSpace(true);
                    }
                    
                    if (allowSelfClosing[lookupKey] === false) {
                        node.setAllowSelfClosing(false);
                    }
                    
                    if (compiler.options.xhtml !== true && startTagOnly[lookupKey] === true) {
                        node.setStartTagOnly(true);
                    }
                }
                
            }
        };
    });
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
        
        var strings = raptor.require('strings');
        
        var TextNode = function(text) {
            TextNode.superclass.constructor.call(this, 'text');
            this.text = text;
        };
        
        TextNode.prototype = {
            doGenerateCode: function(template) {
                var text = this.text;
                if (text) {
                    var preserveWhitespace = this.isPreserveWhitespace();
                    
                    if (!preserveWhitespace) {
                        
                        if (!this.previousSibling) {
                            //First child
                            text = text.replace(/^\n\s*/g, "");  
                        }
                        if (!this.nextSibling) {
                            //Last child
                            text = text.replace(/\n\s*$/g, ""); 
                        }
                        
                        if (/^\n\s*$/.test(text)) { //Whitespace between elements
                            text = '';
                        }
                        
                        text = text.replace(/\s+/g, " ");
                        
                        
                        if (this.isWordWrapEnabled() && text.length > 80) {
                            
                            var start=0,
                                end;
                            
                            while (start < text.length) {
                                end = Math.min(start+80, text.length);
                                
                                var lastSpace = text.substring(start, end).lastIndexOf(' ');
                                if (lastSpace != -1) {
                                    lastSpace = lastSpace + start; //Adjust offset into original string
                                }
                                else {
                                    lastSpace = text.indexOf(' ', end); //No space before the 80 column mark... search for the first space after to break on
                                }
                                
                                if (lastSpace != -1) {
                                    text = text.substring(0, lastSpace) + "\n" + text.substring(lastSpace+1);
                                    start = lastSpace + 1;
                                }
                                else {
                                    break;
                                }
                                
                            }
                        }
                    }

                    template.text(text);
                }
            },
            
            getText: function() {
                return this.text;
            },
            
            setText: function(text) {
                this.text = text;
            },
            
            isTextNode: function() {
                return true;
            },
            
            isElementNode: function() {
                return false;
            },
            
            toString: function() {
                var text = this.text && this.text.length > 25 ? this.text.substring(0, 25) + '...' : this.text;
                text = text.replace(/[\n]/g, '\\n');
                return "[text: " + text + "]";
            }
        };
        
        return TextNode;
    });
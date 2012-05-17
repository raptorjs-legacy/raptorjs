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
    'templating.compiler.ParseTreeBuilder',
    function() {
        
        var sax = raptor.require("xml.sax"),
            forEach = raptor.forEach,
            TextNode = raptor.require('templating.compiler.TextNode'),
            ElementNode = raptor.require('templating.compiler.ElementNode'),
            CORE_UI = "http://raptor.ebayopensource.org/core";
            
          
        var ParseTreeBuilder = function() {
        };
        
        ParseTreeBuilder.parse = function(src, filePath, taglibs) {
            var builder = new ParseTreeBuilder();
            return builder.parse(src, filePath, taglibs);
        };
        
        ParseTreeBuilder.prototype = {
            /**
             * @param src {String} The XML source code to parse
             * @param src {String} The file path (for debugging and error reporting purposes)
             * @param taglibs {templating.compiler$TaglibCollection} The taglib collection. Required for resolving taglib URIs when short names are used. 
             */
            parse: function(src, filePath, taglibs) {
                var logger = this.logger(),
                    parentNode = null,
                    rootNode = null,
                    prevTextNode = null;
                
                var parser = sax.parser({
                        trim: false,
                        normalize: false
                    });
                
                
                parser.on({
                    error: function(e) {
                        raptor.throwError(e);
                    },
                    
                    characters: function(t) {
                        if (!parentNode) {
                            return; //Some bad XML parsers allow text after the ending element...
                        }
                        if (prevTextNode) {
                            prevTextNode.text += t;
                        }
                        else {
                            prevTextNode = new TextNode(t);
                            prevTextNode.pos = parser.getPos();
                            parentNode.appendChild(prevTextNode);
                        }
                        
                    },
                    
                    startElement: function(el) {
                        prevTextNode = null;
                        
                        var elementNode = new ElementNode();
                        elementNode.prefix = el.getPrefix();
                        elementNode.localName = el.getLocalName();
                        elementNode.qName = el.getQName();
                        elementNode.uri = taglibs.resolveURI(el.getURI());
                        elementNode.addNamespaceMappings(el.getNamespaceMappings());
                        
                        elementNode.pos = parser.getPos();
                        
                        forEach(el.getAttributes(), function(attr) {
                            elementNode.setAttributeNS(taglibs.resolveURI(attr.getURI()), attr.getLocalName(), attr.getValue(), attr.getPrefix());
                        }, this);
                        
                        if (parentNode) {
                            parentNode.appendChild(elementNode);
                        }
                        else {
                            rootNode = elementNode;
                        }
                        
                        parentNode = elementNode;
                    },
                    
                    endElement: function () {
                        prevTextNode = null;
                        
                        parentNode = parentNode.parentNode;
                    }
                }, this);
                
                parser.parse(src, filePath);
                
                rootNode._isRoot = true;
                
                return rootNode;
            },
            
            getRootNode: function() {
                return this.rootNode;
            }
        };
        
        return ParseTreeBuilder;
    });
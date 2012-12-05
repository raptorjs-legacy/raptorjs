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

/**
 * @extension Node
 */
define.Class(
    'raptor/xml/SaxParser',
    "xml.sax.BaseSaxParser",
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var sax = require("sax"),
            extend = raptor.extend,
            arrays = require("raptor/arrays"),
            forEachEntry = raptor.forEachEntry;

        
        var Attribute = function(nodeAttr) {
            this.nodeAttr = nodeAttr;
        };
        
        Attribute.prototype = {

            getNamespaceURI: function() {
                var attr = this.nodeAttr;
                return attr.prefix ? attr.uri : '';
            },

            getLocalName: function() {
                return this.nodeAttr.local;
            },

            getQName: function() {
                var attr = this.nodeAttr;
                return attr.prefix ? attr.prefix + ":" + attr.local : attr.local;
            },

            getValue: function() {
                return this.nodeAttr.value;
            },

            getPrefix: function() {
                return this.nodeAttr.prefix;
            }
        };
        
        var Element = function(nodeElement) {
            this.nodeElement = nodeElement;
            this.attributes = null;
        };
        
        Element.prototype = {

            getNamespaceURI: function() {
                return this.nodeElement.uri;
            },

            getLocalName: function() {
                return this.nodeElement.local;
            },

            getQName: function() {
                var node = this.nodeElement;
                return node.prefix ? node.prefix + ":" + node.local : node.local;
            },

            getPrefix: function() {
                return this.nodeElement.prefix;
            },
            
            getAttributes: function() {
                
                if (!this.attributes) {
                    this.attributes = [];
                    
                    forEachEntry(this.nodeElement.attributes, function(name, nodeAttr) {
                        this.attributes.push(new Attribute(nodeAttr));
                    }, this);
                    
                }
                return this.attributes;
            },
            
            getNamespaceMappings: function() {
                return this.nodeElement.ns;
            }
        };
        
        
        
        var SaxParser = function(options) {
            SaxParser.superclass.constructor.call(this, options);
            
            this.nodeParser = sax.parser(true /*strict*/, {
                trim: options.trim === true,
                normalize: options.normalize === true,
                lowercasetags: false,
                xmlns: true
            });
            
            var _this = this,
                stack = [];
            
            extend(this.nodeParser, {
                onerror: function(e) {
                    _this._error(e);
                },
                
                ontext: function(t) {
                    //console.error("ontext: " + t);
                    _this._characters(t);
                },
                
                onopentag: function (node) {
                    
                    var el = new Element(node);
                    //console.error("onopentag: " + el.getQName());
                    
                    stack.push(el);
                    _this._startElement(el);
                },

                oncdata: function(text) {
                    _this._cdata(text);
                },
                
                onclosetag: function () {
                    
                    var el = arrays.pop(stack);
                    //console.error("onclosetag: " + el.getQName());
                    _this._endElement(el);
                },

                oncomment: function (comment) {
                    _this._comment(comment);
                }
            });
        };
        
        SaxParser.prototype = {
                
            parse: function(xmlSrc, filePath) {
                this.filePath = filePath;
                this.nodeParser.write(xmlSrc).close();
            },
            
            getPos: function() {
                var nodeParser = this.nodeParser,
                    filePath = this.filePath;
                
                var line = nodeParser.line + 1;
                
                return {
                    line: line,
                    column: nodeParser.column,
                    filePath: filePath,
                    toString: function() {
                        return this.filePath + ":" + this.line + ":" + this.column;
                    }
                    
                };
            }
        };
        
        return SaxParser;
        
    });
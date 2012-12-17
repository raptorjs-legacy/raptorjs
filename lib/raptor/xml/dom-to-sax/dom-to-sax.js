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

define(
    "raptor/xml/dom-to-sax",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var Attribute = function(node) {
            this.node = node;
        };
        
        Attribute.prototype = {

            getNamespaceURI: function() {
                return this.node.namespaceURI || '';
            },

            getLocalName: function() {
                return this.node.localName;
            },

            getQName: function() {
                return this.node.prefix ? this.node.prefix + ':' + this.node.localName : this.node.localName;
            },

            getValue: function() {
                return this.node.nodeValue;
            },
            
            getPrefix: function() {
                return this.node.prefix;
            },
            
            toString: function() {
                return "[Attribute: " + 
                    "uri=" + this.getNamespaceURI() + 
                    ", qName=" + this.getQName() +
                    ", value=" + this.getValue() + "]";
            }
        };
        
        var Element = function(node) {
            this.node = node;
        };
        
        Element.prototype = {

            getNamespaceURI: function() {
                return this.node.namespaceURI || '';
            },

            getLocalName: function() {
                return this.node.localName;
            },

            getQName: function() {
                return this.node.prefix ? this.node.prefix + ':' + this.node.localName : this.node.localName;
            },

            getPrefix: function() {
                return this.node.prefix || '';
            },
            
            getAttributes: function() {
                var attributes = this.attributes;
                if (!attributes) {
                    attributes = this.attributes = [];
                
                    var attrMap = this.node.attributes;
                    
                    for (var i=0, len=attrMap.length; i<len; i++) {
                        attributes.push(new Attribute(attrMap.item(i)));
                    }
                }
                
                return attributes;
            },
            
            getNamespaceMappings: function() {
                var mappings = this._namespaceMappings;
                if (!mappings) {
                    mappings = this._namespaceMappings = {};
                    
                    raptor.forEach(this.getAttributes(), function(attr) {
                        if (attr.getPrefix() === 'xmlns') {
                            mappings[attr.getLocalName()] = attr.getValue();
                        }
                    }, this);
                }
                
                return mappings;
                
            },
            
            toString: function() {
                var attributes = [];
                raptor.forEach(this.getAttributes(), function(attr) {
                    attributes.push(attr.toString());
                }, this);
                attributes = attributes.join(", ");
                
                return "[Element: uri=" + this.getNamespaceURI() + ", localName=" + this.getLocalName() + ", qName=" + this.getQName() + ", prefix=" + this.getPrefix() + ", attributes=[" + attributes + "], ns=" + JSON.stringify(this.getNamespaceMappings()) + "]";
            }
        };
        
        return {
            
            /**
             * 
             * @param node
             * @param handlers
             * @returns
             */
            domToSax: function(node, handlers, thisObj) {
                var observable = require('raptor/listeners').createObservable(['startElement', 'endElement', 'comment', 'characters'], true);
                observable.subscribe(handlers, thisObj);
                
                var _text = function(node) {
                        observable.characters(node.nodeValue);
                    },
                    _comment = function(node) {
                        observable.comment(node.nodeValue);
                    },
                    
                    _element = function(node) {
                        var el = new Element(node);
                        observable.startElement(el);
                        var childNodes = node.childNodes,
                            len = childNodes.length;
                        for (var i=0; i<len; i++) {
                            var childNode = childNodes[i];
                            _node(childNode);
                        }
                        
                        observable.endElement(el);
                    },
                    _node = function(node) {
                        switch(node.nodeType) {
                            case 1: _element(node); break;                   //Element
                            case 2: break;                      //Attribute
                            case 3: _text(node); break;     //CDATA
                            case 4: _text(node); break;     //Text
                            case 5: _text(node); break;     //Entity reference
                            case 6: _text(node); break;     //Entity node
                            case 7: break;                      //Processing instruction
                            case 8: _comment(node); break;     //Comment node
                            case 9: _element(node.documentElement); break;     //Document node
                        }
                    };
                
                _node(node);
            }
        };
        
    });
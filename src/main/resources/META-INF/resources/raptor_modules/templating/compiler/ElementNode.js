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
    'templating.compiler.ElementNode',
    'templating.compiler.Node',
    function() {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            escapeXmlAttr = raptor.require("xml.utils").escapeXmlAttr,
            XML_URI = 'http://www.w3.org/XML/1998/namespace',
            XML_URI_ALT = 'http://www.w3.org/XML/1998/namespace',
            ExpressionParser = raptor.require('templating.compiler.ExpressionParser');
        
        var ElementNode = function() {
            ElementNode.superclass.constructor.call(this, 'element');
            this.prefix = null;
            this.localName = null;
            this.uri = null;
            this.qName = null;
            this.dynamicAttributesExpression = null;
            this.attributes = {};

            this.allowSelfClosing = true;
            this.startTagOnly = false;
        };
        
        ElementNode.prototype = {
            /**
             * 
             * @param startTagOnly
             */
            setStartTagOnly: function(startTagOnly) {
                this.startTagOnly = true;
            },
            
            /**
             * 
             * @param allowSelfClosing
             */
            setAllowSelfClosing: function(allowSelfClosing) {
                this.allowSelfClosing = allowSelfClosing;
            },
            
            /**
             * 
             * @returns {Boolean}
             */
            isElementNode: function() {
                return true;
            },
            
            /**
             * 
             * @returns {Boolean}
             */
            isTextNode: function() {
                return false;
            },
            
            /**
             * 
             * @returns {Array}
             */
            getAttributes: function() {
                var attributes = [];
                forEachEntry(this.attributes, function(name, attr) {
                    attributes.push(attr);
                }, this);
                return attributes;
            },
            
            /**
             * 
             * @param name
             * @returns
             */
            getAttribute: function(name) {
                return this.getAttributeNS(null, name);
            },
            
            /**
             * 
             * @param uri
             * @param localName
             * @returns
             */
            getAttributeNS: function(uri, localName) {
                var attr = this.attributes[(uri || '') + ":" + localName];
                return attr ? attr.value : null;
            },
            
            /**
             * 
             * @param localName
             * @param value
             */
            setAttribute: function(localName, value) {
                this.setAttributeNS(null, localName, value);
            },
            
            /**
             * 
             * @param uri
             * @param localName
             * @param value
             * @param prefix
             */
            setAttributeNS: function(uri, localName, value, prefix) {
                
                this.attributes[(uri || '') + ":" + localName] = {
                    localName: localName,
                    value: value,
                    prefix: prefix,
                    uri: uri,
                    qName: prefix ? (prefix + ":" + localName) : localName,
                    name: uri ? (uri + ":" + localName) : localName,
                    toString: function() {
                        return this.name;
                    }
                };
            },
            
            /**
             * 
             * @param name
             */
            setEmptyAttribute: function(name) {
                this.setAttribute(name, null);
            },
            
            /**
             * 
             * @param localName
             */
            removeAttribute: function(localName) {
                this.removeAttributeNS(null, localName);
            },
            
            /**
             * 
             * @param uri
             * @param localName
             */
            removeAttributeNS: function(uri, localName) {
                delete this.attributes[(uri || '') + ":" + localName];
            },
            
            /**
             * 
             * @returns {Boolean}
             */
            isPreserveSpace: function() {
                return this.preserveSpace === true || this.getAttributeNS(XML_URI, "space") === "preserve" || this.getAttributeNS(XML_URI_ALT, "space") === "preserve" || this.getAttribute("xml:space") === "preserve"; 
            },
            
            removePreserveSpaceAttr: function() {
                this.removeAttributeNS(XML_URI, "space");
                this.removeAttributeNS(XML_URI_ALT, "space");
                this.removeAttribute("space");
            },
            
            /**
             * 
             * @param preserve
             */
            setPreserveSpace: function(preserve) {
                this.preserveSpace = preserve;
            },
            
            setStripExpression: function(stripExpression) {
                this.stripExpression = stripExpression;
            },
            
            /**
             * 
             * @param template
             */
            doGenerateCode: function(template) {
                this.generateBeforeCode(template);
                this.generateCodeForChildren(template);
                this.generateAfterCode(template);
            },
            
            generateBeforeCode: function(template) {
                var preserveSpace = this.preserveSpace = this.isPreserveSpace();
                
                var name = this.prefix ? (this.prefix + ":" + this.localName) : this.localName;
                
                if (preserveSpace) {
                    this.removePreserveSpaceAttr();
                }
                
                template.addText("<" + name);
                if (this.attributes) {
                    forEachEntry(this.attributes, function(key, attr) {
                        template.addText(" ");
                        
                        var prefix = attr.prefix;
                        if (!prefix && attr.uri) {
                            prefix = this.resolveNamespacePrefix(attr.uri);
                        }
                        
                        if (prefix) {
                            name = prefix + (attr.localName ? (":" + attr.localName) : "");
                        }
                        else {
                            name = attr.localName;
                        }
                        
                        if (attr.value === null || attr.value === undefined) {
                            template.addText(name);
                        }
                        else {
                            template.addText(name + '="');
                            
                            ExpressionParser.parse(
                                attr.value,
                                {
                                    text: function(text) {
                                        template.addText(escapeXmlAttr(text));
                                    },
                                    xml: function(text) {
                                        template.addText(text);
                                    },
                                    expression: function(expression) {
                                        template.addWrite(expression, {escapeXmlAttr: true});
                                    },
                                    error: function(message) {
                                        this.addError('Invalid expression found in attribute "' + name + '". ' + message);
                                    }
                                },
                                this,
                                {
                                    custom: {
                                        "entity": function(expression, helper) {
                                            helper.add('xml', "&" + expression + ";"); 
                                        }
                                    }
                                });
                            
                            template.addText('"');
                        }
                    }, this);
                }
                
                if (this.dynamicAttributesExpression) {
                    template.addJavaScriptCode(template.getContextHelperFunction("attrs", "a") + "(" + this.dynamicAttributesExpression + ");");
                }
                
                if (this.childNodes.length) {
                    template.addText(">");
                }
                else {
                    if (this.startTagOnly) {
                        template.addText(">");
                    }
                    else if (this.allowSelfClosing) {
                        template.addText("/>");
                    }
                }
            },
            
            generateAfterCode: function(template) {
                var name = this.prefix ? (this.prefix + ":" + this.localName) : this.localName;
                
                if (this.childNodes.length) {
                    template.addText("</" + name + ">");
                }
                else {
                    if (!this.startTagOnly && !this.allowSelfClosing) {
                        template.addText("></" + name + ">");
                    }
                }
            },
            
            toString: function() {
                return "<" + (this.prefix ? (this.prefix + ":" + this.localName) : this.localName) + ">";
            }
        
        };
        
        return ElementNode;
    });
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
 * @extension Rhino
 */
define.Class('raptor/xml/SaxParser', 'raptor/xml/sax/BaseSaxParser', ['raptor'], function (raptor, require) {
    'use strict';
    var arrays = require('raptor/arrays'), java = require('raptor/java'), SAXParserFactory = Packages.javax.xml.parsers.SAXParserFactory, DefaultHandler = Packages.org.xml.sax.helpers.DefaultHandler, JavaString = Packages.java.lang.String, factory = SAXParserFactory.newInstance();
    factory.setNamespaceAware(true);
    var Attribute = function (uri, localName, qName, value) {
        this.uri = uri;
        this.localName = localName;
        this.qName = qName;
        this.value = value;
    };
    Attribute.prototype = {
        getNamespaceURI: function () {
            var prefix = this.getPrefix();
            return prefix ? this.uri : '';
        },
        getLocalName: function () {
            return this.localName;
        },
        getQName: function () {
            return this.qName;
        },
        getValue: function () {
            return this.value;
        },
        getPrefix: function () {
            var qName = this.getQName();
            var colonIndex = qName.indexOf(':');
            return colonIndex === -1 ? '' : qName.substring(0, colonIndex);
        },
        toString: function () {
            return '[Attribute: ' + 'uri=' + this.uri + ', qName=' + this.getQName() + ', prefix=' + this.getPrefix() + ', value=' + this.value + ']';
        }
    };
    var Element = function (uri, localName, qName, javaAttributes, prefixMappings) {
        this.uri = uri;
        this.localName = localName;
        this.qName = qName;
        this.javaAttributes = javaAttributes;
        this.prefixMappings = prefixMappings;
    };
    Element.prototype = {
        getNamespaceURI: function () {
            var prefix = this.getPrefix();
            return prefix ? this.uri : '';
        },
        getLocalName: function () {
            return this.localName;
        },
        getQName: function () {
            return this.qName;
        },
        getPrefix: function () {
            var qName = this.getQName();
            var colonIndex = qName.indexOf(':');
            return colonIndex === -1 ? '' : qName.substring(0, colonIndex);
        },
        getAttributes: function () {
            var attributes = this.attributes;
            if (!attributes) {
                attributes = this.attributes = [];
                var javaAttributes = this.javaAttributes;
                for (var i = 0, len = javaAttributes.getLength(); i < len; i++) {
                    var localName = javaAttributes.getLocalName(i), qName = javaAttributes.getQName(i), uri = javaAttributes.getURI(i), value = javaAttributes.getValue(i);
                    if (!localName) {
                        localName = qName;
                    }
                    attributes.push(new Attribute(uri, localName, qName, value));
                }
            }
            return attributes;
        },
        getNamespaceMappings: function () {
            return this.prefixMappings;
        },
        toString: function () {
            var attributes = [];
            arrays.forEach(this.getAttributes(), function (attr) {
                attributes.push(attr.toString());
            }, this);
            attributes = attributes.join(', ');
            return '[Element: uri=' + this.getNamespaceURI() + ', localName=' + this.localName + ', qName=' + this.qName + ', prefix=' + this.getPrefix() + ', attributes=[' + attributes + ']]';
        }
    };
    var SaxParser = function (options) {
        SaxParser.superclass.constructor.call(this, options);
    };
    SaxParser.prototype = {
        parse: function (xmlSrc, filePath) {
            this.filePath = filePath;
            var _this = this, stack = [], prefixMappings = {};
            var handler = new JavaAdapter(DefaultHandler, {
                    error: function (e) {
                        _this._error(e);
                    },
                    startElement: function (uri, localName, qName, attributes) {
                        uri = uri;
                        localName = localName;
                        qName = qName;
                        if (!localName) {
                            localName = qName;
                        }
                        //console.log('startElement: uri=' + uri + ', localName=' + localName + ', qName=' + qName);
                        var el = new Element(uri, localName, qName, attributes, prefixMappings);
                        //console.log("ELEMENT: " + el.toString());
                        prefixMappings = {};
                        stack.push(el);
                        _this._startElement(el);
                    },
                    endElement: function () {
                        var el = arrays.pop(stack);
                        _this._endElement(el);
                    },
                    characters: function (chars, start, length) {
                        var t = String(new JavaString(chars, start, length));
                        //console.log('characters: text=' + t);
                        _this._characters(t);
                    },
                    startPrefixMapping: function (prefix, uri) {
                        //console.log("PREFIX MAPPING: " + prefix + "=" + uri);
                        prefixMappings[prefix] = uri;    //console.log('startPrefixMapping: prefix=' + prefix + ', uri=' + uri);
                    }
                });
            var saxParser = factory.newSAXParser();
            saxParser.parse(java.getStringInputStream(xmlSrc), handler);
        },
        getPos: function () {
            var filePath = this.filePath;
            return {
                line: -1,
                column: -1,
                filePath: filePath,
                toString: function () {
                    return this.filePath + ':' + this.line + ':' + this.column;
                }
            };
        }
    };
    return SaxParser;
});
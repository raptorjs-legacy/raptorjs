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
    'raptor/xml/sax/object-mapper',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var sax = require('raptor/xml/sax'),
            forEachEntry = raptor.forEachEntry,
            arrays = require("raptor/arrays"),
            strings = require('raptor/strings'),
            STRING = "string",
            BOOLEAN = "boolean",
            OBJECT = "object",
            NUMBER = "number",
            INTEGER = "integer",
            INT = "int",
            getSchema = function(el, nodeType, parentSchema) {
                var lookupSchema = function(key) {
                    var schema;
                    
                    if (nodeType === 'attribute') {
                        schema = parentSchema['@' + key];
                    }
                    else if (nodeType === 'element') {
                        schema = parentSchema['<' + key + '>'];
                    }
                    if (!schema) {
                        schema = parentSchema[key];
                    }
                    return schema;
                };
                
                var uri = el.getNamespaceURI(),
                    schema;
                
                if (uri) {
                    schema = lookupSchema(uri + ":" + el.getLocalName());
                    if (!schema) {
                        schema = lookupSchema(uri + ":*");                                        
                    }
                }
                else {
                    schema = lookupSchema(el.getLocalName());
                }
                
                if (!schema) {
                    schema = lookupSchema("*");                                        
                }
                
                if (typeof schema === 'function') {
                    schema = schema(el, nodeType);
                }
                
                return schema;
            },
            _expected = function(parentSchema, isAttribute) {
                var expected = [];
                //console.log(curType);
                forEachEntry(parentSchema, function(key, value) {
                    if (strings.startsWith(key, "_")) {
                        return;
                    }
                    
                    if (isAttribute && value._type === OBJECT) {
                        return;
                    }
                    
                    expected.push(isAttribute ? key : key.charAt(0) === '<' ? key : "<" + key + ">");
                    
                }, this);
                return '[' + expected.join(', ') + ']';
            };
        
        var Reader = function(schema, options) {
            if (!options) {
                options = {};
            }
            this.skipping = false;
            this.options = options;
            this.trimText = options.trimText !== false;
            this.contextStack = [];
            this.schema = schema;
        };
        
        Reader.prototype = {
            _parseProp: function(value, context) {
                var parsePropFunc = this.options.parseProp;
                
                if (parsePropFunc) { //If a property parser is provide then invoke that to get the actual text
                    value = parsePropFunc(value, context);
                }
                return value;
            },
            
            _setProperty: function(el, schema, targetObject, value, context) {
                if (typeof value === 'string') {
                    if (this.trimText) { //Trim the text if that option is enabled
                        value = strings.trim(value);
                    }
                    
                    value = this._parseProp(value, context);
                    
                    if (schema._type === BOOLEAN) {
                        /*
                         * Convert the text to a boolean value
                         */
                        value = value.toLowerCase();
                        value = value === 'true' || value === 'yes';
                    }
                    else if (schema._type === INTEGER || schema._type === INT) {
                        /*
                         * Convert the text to a boolean value
                         */
                        value = parseInt(value, 10);
                    }
                    else if (schema._type === NUMBER) {
                        console.error("NUMBER: ", value);
                        /*
                         * Convert the text to a boolean value
                         */
                        value = parseFloat(value);
                        console.error("NUMBER AFTER: ", value);
                    }
                }
                
                var propertyName = schema._targetProp;
                if (!propertyName && this.options.defaultTargetProp) {
                    propertyName = this.options.defaultTargetProp(context);
                }
                
                if (!propertyName) {
                    propertyName = (typeof el === 'string' ? el : (el.getNamespaceURI() ? el.getNamespaceURI() + ":" + el.getLocalName() : el.getLocalName()));
                }
                
                if (schema._set) {
                    schema._set(targetObject, propertyName, value, context);
                }
                else {
                    var setter = 'set' + propertyName.substring(0, 1).toUpperCase() + propertyName.substring(1);
                    if (targetObject[setter]) {
                        targetObject[setter](value);
                    }
                    else {
                        targetObject[propertyName] = value;    
                    }
                    
                }
            },
                
            skipCurrentElement: function() {
                if (this.skipping) {
                    return;
                }
                
                var context = this.getCurrentContext();
                context.skip = true;
                this.skipping = true;
            },
            
            error: function(message) {
                throw raptor.createError(new Error(message + " (" + this.saxParser.getPos() + ")"));
            },
            
            getCurrentContext: function() {
                return arrays.peek(this.contextStack);
            },
            
            read: function(xmlSrc, filePath) {
                
                this.saxParser = sax.createParser({
                    trim: true,
                    normalize: true
                });
                
                this.contextStack = [];
                this.skipping = false;
                
                var _this = this,
                    rootObject,
                    saxParser = this.saxParser;
                
                var handleCharacters = function(text) {
                    if (_this.skipping === true) {
                        return;
                    }
                    
                    var context = _this.getCurrentContext();
                    context.text = context.text ? context.text + text : text;
                };
                
                saxParser.on({
                    error: function (e) {
                        _this.error(e);
                    },
                    
                    startElement: function (el) {
                        var parentContext = _this.getCurrentContext(),
                            parentSchema = parentContext ? parentContext.schema : _this.schema,
                            curSchema;
                        
                        var context = {
                           el: el, 
                           name: el.getQName(),
                           tagName: el.getLocalName(),
                           localName: el.getLocalName(),
                           uri: el.getNamespaceURI(),
                           parentContext: parentContext
                        };
                        
                        _this.contextStack.push(context);
                        
                        if (_this.skipping) {
                            return;
                        }
                        
                        context.schema = curSchema = getSchema(el, "element", parentSchema);
                            
                        if (!curSchema) {
                            _this.error("Unexpected element: <" + el.getQName() + ">. Expected one of: " + _expected(parentSchema));
                        }
                        
                        if (curSchema._type === STRING || curSchema._type === BOOLEAN) {
                            if (curSchema._begin) {
                                curSchema._begin(parentContext ? parentContext.object : null, context);
                            }
                        }
                        else if (curSchema._type === OBJECT) {
                            
                            context.object = curSchema._begin ? curSchema._begin(parentContext ? parentContext.object : null, context) || {} : {};
                            if (!context.object) {
                                throw new Error('_begin() for "' + el.getLocalName() + '" did not return an object.');
                            }
                        }
                        
                        if (!_this.skipping) {
                            var attrs = el.getAttributes();
                            
                            for (var i=0, len=attrs.length, attr; i<len; i++) {
                                attr = attrs[i];
                                if (_this.skipping) {
                                    break;
                                }
                                
                                var attrSchema = getSchema(attr, "attribute", curSchema);
                                if (!attrSchema) {
                                    _this.error("Unexpected attribute: " + attr.getQName() + ". Expected one of: " + _expected(curSchema, true));
                                }
                                
                                var attrContext = raptor.extend({}, context);
                                attrContext.attr = attr;
                                attrContext.localName = attr.getLocalName();
                                attrContext.uri = attr.getNamespaceURI();
                                attrContext.name = attr.getQName();
                                _this._setProperty(
                                        attr, //Current attribute
                                        attrSchema,  //Schema associated with the attribute
                                        context.object,  //Target object
                                        attr.getValue(),  //The value of the property
                                        attrContext); //The context for the attribute
                                
                            }
                        }
                    },
    
                    characters: function (text) {
                        handleCharacters(text);
                    },
                    
                    cdata: function (text) {
                        handleCharacters(text);
                    },
    
                    endElement: function () {
                        
                        var context = _this.getCurrentContext(),
                            parentContext = context.parentContext,
                            curSchema = context.schema;
                        
                        if (_this.skipping !== true) {
                            
                            if (curSchema._type === STRING || curSchema._type === BOOLEAN) {
                                
                                _this._setProperty(context.el, curSchema, parentContext ? parentContext.object : null, context.text, context);
                                
                                if (curSchema._end) {
                                    curSchema._end(context.object, parentContext ? parentContext.object : null, context);
                                }
                            }
                            else if (curSchema._type === OBJECT) {
                                
                                if (context.text != null && strings.trim(context.text)) {
                                    if (curSchema._text) {
                                        _this._setProperty("text", curSchema._text, context.object, context.text, context);
                                    }
                                    else if (curSchema._setText) {
                                        curSchema._setText(context.object, _this._parseProp(context.text, context));
                                    }
                                    else {
                                        _this.error("Unexpected text: " + context.text);
                                    }
                                }
                                if (curSchema._end) {
                                    curSchema._end(context.object, parentContext ? parentContext.object : null, context);
                                }
                                
                                if (curSchema._targetProp) {
                                    _this._setProperty(context.el, curSchema, parentContext ? parentContext.object : null, context.object);                                    
                                }
                                
                            }
                            else if (curSchema._type) {
                                throw new Error("Invalid type: " + curSchema._type);
                            }
                        } //End: this.skipping !== true
                        
                        if (_this.contextStack.length === 1) {
                            rootObject = context.object;
                        }
                        
                        arrays.pop(_this.contextStack);
                        
                        if (context.skip === true) {
                            _this.skipping = false;
                        }
                    }
                });
                
                saxParser.parse(xmlSrc, filePath);
                
                return rootObject;
            }
        };
        
        return {
            createReader: function(schema, options) {
                return new Reader(schema, options);
            },
            
            read: function(xmlSrc, filePath, schema, options) {
                return this.createReader(schema, options).read(xmlSrc, filePath);
            }
            
        };
    });
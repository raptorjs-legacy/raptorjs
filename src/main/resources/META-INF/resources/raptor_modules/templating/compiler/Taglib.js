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
    'templating.compiler.Taglib',
    function(raptor) {
        "use strict";
        
        var Taglib = function() {
            this.uri = null;
            this.shortName = null;
            this.tags = {};
            this.textTransformers = [];
            this.attributeMap = {};
            this.functions = [];
            
            this.patternAttributes = [];
        };
        
        Taglib.prototype = {
            
            addAttribute: function(attribute) {
                if (attribute.uri) {
                    throw raptor.createError(new Error('"uri" is not allowed for taglib attributes'));
                }
                
                if (attribute.name) {
                    this.attributeMap[attribute.name] = attribute;    
                }
                else {
                    this.patternAttributes.push(attribute);
                }
            },
            
            getAttribute: function(name) {
                var attribute = this.attributeMap[name];
                if (!attribute) {
                    for (var i=0, len=this.patternAttributes.length; i<len; i++) {
                        var patternAttribute = this.patternAttributes[i];
                        if (patternAttribute.pattern.test(name)) {
                            attribute = patternAttribute;
                        }
                    }
                }
                
                return attribute;
            },
            
            addTag: function(tag) {
                var key = (tag.uri || '') + ":" + tag.name;
                tag._taglib = this;
                this.tags[key] = tag;
            },
            
            
            
            
            addTextTransformer: function(transformer) {
                this.textTransformers.push(transformer);
            },
            
            forEachTag: function(callback, thisObj) {
                raptor.forEachEntry(this.tags, function(key, tag) {
                    callback.call(thisObj, tag);
                }, this);
            },
            
            addFunction: function(func) {
                this.functions.push(func);
            }
        };
        
        Taglib.Tag = raptor.defineClass(function() {
            var Tag = function() {
                this.name = null;
                this.uri = null;
                this.handlerClass = null;
                this.dynamicAttributes = false;
                this.attributeMap = {};
                this.transformers = [];
                this.nestedVariables = [];
                this.importedVariables = [];
                this._taglib = null;
            };
            
            Tag.prototype = {
                addAttribute: function(attr) {
                    var uri = attr.uri || '';
                    this.attributeMap[uri + ':' + attr.name] = attr;
                },
                
                getAttribute: function(uri, localName) {
                    if (uri == null) {
                        uri = '';
                    }
                    
                    return this.attributeMap[uri + ':' + localName] || this.attributeMap[uri + ':*'] || this.attributeMap['*:' + localName] || this.attributeMap['*:*'];
                },
                
                getTaglibUri: function() {
                    if (!this._taglib) {
                        throw raptor.createError(new Error('Taglib not set for tag. (uri=' + this.uri + ', name=' + this.name + ')'));
                    }
                    return this._taglib.uri;
                },
                
                toString: function() {
                    return "[Tag: <" + this.uri + ":" + this.name + ">]";  
                },
                
                forEachAttribute: function(callback, thisObj) {
                    raptor.forEachEntry(this.attributeMap, function(attrName, attr) {
                        callback.call(thisObj, attr);
                    });
                },
                
                addNestedVariable: function(nestedVariable) {
                    this.nestedVariables.push(nestedVariable);
                },
                
                addImportedVariable: function(importedVariable) {
                    this.importedVariables.push(importedVariable);
                },
                
                addTransformer: function(transformer) {
                    this.transformers.push(transformer);
                }
            };
            
            return Tag;
        });
        
        Taglib.Attribute = raptor.defineClass(function() {
            var Attribute = function() {
                this.name = null;
                this.uri = null;
                this.type = null;
                this.required = false;
                this.type = "string";
                this.allowExpressions = true;
            };
            
            Attribute.prototype = {
                getAttribute: function(uri, localName) {
                    if (uri == null) {
                        uri = '';
                    }
                    if (!this.attributeMap) {
                        return null;
                    }
                    
                    return this.attributeMap[uri + ':' + localName] || this.attributeMap[uri + ':*'] || this.attributeMap['*:' + localName] || this.attributeMap['*:*'];
                },
                
                toString: function() {
                    return "[Tag: <" + this.uri + ":" + this.name + ">]";  
                }
            };
            
            return Attribute;
        });
        
        Taglib.NestedVariable = raptor.defineClass(function() {
            var NestedVariable = function() {
                this.name = null;
            };
            
            NestedVariable.prototype = {
                
            };
            
            return NestedVariable;
        });
        
        Taglib.ImportedVariable = raptor.defineClass(function() {
            var ImportedVariable = function() {
                this.targetProperty = null;
                this.expression = null;
            };
            
            ImportedVariable.prototype = {
                
            };
            
            return ImportedVariable;
        });
        
        Taglib.Transformer = raptor.defineClass(function() {
            var uniqueId = 0;
            
            var Transformer = function() {
                this.id = uniqueId++; 
                this.tag = null;
                this.className = null;
                this.after = null;
                this.before = null;
                this.instance = null;
                this.properties = {};
                
            };
            
            Transformer.prototype = {
                getInstance: function() {
                    if (!this.className) {
                        throw raptor.createError(new Error("Transformer class not defined for tag transformer (tag=" + this.tag + ")"));
                    }
                    
                    if (!this.instance) {
                        var Clazz = raptor.require(this.className);
                        this.instance = new Clazz();
                        this.instance.id = this.id;
                    }
                    return this.instance;
                },
                
                toString: function() {
                    return '[Taglib.Transformer: ' + this.className + ']';
                }
            
            };
            
            return Transformer;
        });
        
        Taglib.Function = raptor.defineClass(function() {
            var Function = function() {
                this.name = null;
                this.functionClass = null;
                this.bindToContext = false;
            };
            
            Function.prototype = {
                
            };
            
            return Function;
        });
        
        return Taglib;
    });
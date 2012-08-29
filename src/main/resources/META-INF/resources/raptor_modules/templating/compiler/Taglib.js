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
//            this.uri = null;
//            this.shortName = null;
//            this.tags = [];
//            this.textTransformers = [];
        };
        
        Taglib.prototype = {
            
        };
        
        Taglib.Tag = raptor.defineClass(function() {
            var Tag = function() {
//                this.name = null;
//                this.uri = null;
//                this.handlerClass = null;
//                this.dynamicAttributes = false;
//                
//                this.attributeMap = {};
//                this.transformers = [];
//                this.nestedVariables = [];
//                this.importedVariables = [];
            };
            
            Tag.prototype = {
                getAttributeDef: function(uri, localName) {
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
                },
                
                forEachAttribute: function(callback, thisObj) {
                    raptor.forEachEntry(this.attributeMap, function(attrName, attr) {
                        callback.call(thisObj, attr);
                    });
                }
            };
            
            return Tag;
        });
        
        Taglib.Transformer = raptor.defineClass(function() {
            var uniqueId = 0;
            
            var Transformer = function() {
                this.id = uniqueId++; 
                this.tag = null;
                this.className = null;
                this.instance = null;
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
        
        return Taglib;
    });
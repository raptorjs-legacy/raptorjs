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
    'templating.compiler.TaglibCollection',
    function(raptor) {
        var forEach = raptor.forEach,
            extend = raptor.extend,
            Taglib = raptor.require("templating.compiler.Taglib"),
            ElementNode = raptor.require('templating.compiler.ElementNode'),
            TextNode = raptor.require('templating.compiler.TextNode'),
            Tag = Taglib.Tag,
            Transformer = Taglib.Transformer;
        
        var TaglibCollection = function() {
            this.tagTransformers = {}; //Tag transformers lookup
            this.tagDefs = {}; //Tag definitions lookup
            this.textTransformers = [];
            this.taglibUris = {};
            this.shortnameToUriMapping = {};
            
        };
        
        TaglibCollection.prototype = {
                
            isTaglib: function(uri) {
                return this.taglibUris[uri] === true;
            },
            
            add: function(taglib) {
                
                //console.log("Adding taglib: ", JSON.stringify(taglib));
                
                this.taglibUris[taglib.uri] = true;
                if (taglib.shortName) {
                    this.taglibUris[taglib.shortName] = true;
                    this.shortnameToUriMapping[taglib.shortName] = taglib.uri;
                }
                
                
                forEach(taglib.tags, function(tag) {
                    
                    var uri = tag.uri == null ? taglib.uri : tag.uri,
                        name = tag.name,
                        key = uri + ":" + name;
                    
                    
                    
                    tag = extend(new Tag(), tag);
                    tag.taglib = taglib;
                    
                    this.tagDefs[key] = tag;
                    
                    
                    if (tag.transformers) {
                        var tagTransformers;
                        if (!(tagTransformers = this.tagTransformers[key])) {
                            //console.error("TAG TRANSFOMER: " + key);
                            this.tagTransformers[key] = tagTransformers = {
                                    transformers: [],
                                    after: {}
                            };
                        }
                        
                        
                        forEach(tag.transformers, function(transformer) {
                            transformer = extend(new Transformer(), transformer);
                            
                            if (transformer.after) {
                                
                                var after = tagTransformers.after[transformer.after];
                                if (!after) {
                                    after = tagTransformers.after[transformer.after] = [];
                                }
                                after.push(transformer);
                            }
                            else {
                                tagTransformers.transformers.push(transformer);                                
                            }
                            
                        }, this);
                    }
                    
                    
                }, this);
                
                forEach(taglib.textTransformers, function(textTransformer) {
                    this.textTransformers.push(extend(new Transformer(), textTransformer));
                }, this);
            },
            
            forEachNodeTransformer: function(node, callback, thisObj) {
                /*
                 * Based on the type of node we have to choose how to transform it
                 */
                if (node instanceof ElementNode) {
                    this.forEachTagTransformer(node.uri, node.localName, callback, thisObj);
                }
                else if (node instanceof TextNode) {
                    this.forEachTextTransformer(callback, thisObj);
                }
            },
            
            resolveURI: function(uri) {
                if (!uri) {
                    return;
                }
                return this.shortnameToUriMapping[uri] || uri;
            },
            
            forEachTagTransformer: function(uri, tagName, callback, thisObj) {
                /*
                 * If the node is an element node then we need to find all matching
                 * transformers based on the URI and the local name of the element.
                 */
                
                if (uri == null) {
                    uri = '';
                }
                
                //console.error("forEachTagTransformer(): ", uri, tagName);
                var keepGoing = true,
                    _this = this;
                
                var tagTransformers = this.tagTransformers,
                    _addTransformers = function(tagTransformers) {
                        if (!tagTransformers) {
                            return;
                        }
                        
                        var handleTransformers = function(transformers) {
                            if (keepGoing === false) {
                                return false;
                            }
                            
                            forEach(transformers, function(transformer) {
                                keepGoing = callback.call(thisObj, transformer);
                                
                                if (keepGoing === false) {
                                    return false;
                                }
                                

                                if (tagTransformers.after[transformer.className]) {
                                    handleTransformers(tagTransformers.after[transformer.className]);
                                }
                            });
                        };
                        
                        handleTransformers(tagTransformers.transformers);
                    };
                
                _addTransformers(tagTransformers[uri + ":" + tagName]);
                _addTransformers(tagTransformers[uri + ":*"]);
                _addTransformers(tagTransformers["*:*"]);
            },
            
            forEachTextTransformer: function(callback, thisObj) {
                forEach(this.textTransformers, function(textTransformer) {
                    var keepGoing = callback.call(thisObj, textTransformer);
                    if (keepGoing === false) {
                        return false;
                    }
                });
            },
            
            getTagDef: function(uri, localName) {
                if (uri) {
                    return this.tagDefs[uri + ":" + localName];
                }
                else {
                    return this.tagDefs[localName];
                }
                
            }
        };
        
        return TaglibCollection;
    });
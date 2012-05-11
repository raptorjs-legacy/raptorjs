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
            this.tagTransformers = {};
            this.tagDefs = {};
            this.textTransformers = [];
            this.taglibUris = {};
            
        };
        
        TaglibCollection.prototype = {
                
            isTaglib: function(uri) {
                return this.taglibUris[uri] === true;
            },
            
            add: function(taglib) {
                
                //console.log("Adding taglib: ", JSON.stringify(taglib));
                
                this.taglibUris[taglib.uri] = true;
                
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
                return this.tagDefs[uri ? uri + ":" + localName : localName];
            }
        };
        
        return TaglibCollection;
    });
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
 * Merges a set of taglibs for ea
 */
raptor.defineClass(
    'templating.compiler.TaglibCollection',
    function(raptor) {
        "use strict";
        
        var forEach = raptor.forEach,
            extend = raptor.extend,
            Taglib = raptor.require("templating.compiler.Taglib"),
            ElementNode = raptor.require('templating.compiler.ElementNode'),
            TextNode = raptor.require('templating.compiler.TextNode'),
            Tag = Taglib.Tag,
            Transformer = Taglib.Transformer;
        
        var TaglibCollection = function() {
            this.tagTransformersLookup = {}; //Tag transformers lookup
            this.tagDefs = {}; //Tag definitions lookup
            this.textTransformers = [];
            this.taglibUris = {}; //Lookup to track the URIs of taglibs that have been added to this collection
            this.shortNameToUriMapping = {};
            this.uriToShortNameMapping = {};
            
        };
        
        TaglibCollection.prototype = {
                
            /**
             * Checks if the provided URI is the URI of a taglib
             * 
             * @param uri {String} The URI to check
             * @returns {Boolean} Returns true if the URI is that of a taglib. False, otherwise.
             */
            isTaglib: function(uri) {
                return this.taglibUris[uri] === true;
            },
            
            /**
             * Adds a new taglib to the collection
             * 
             * @param taglib {templating.compiler$Taglib} The taglib to add
             */
            add: function(taglib) {
                
                if (this.taglibUris[taglib.uri]) { //Check if a taglib with the same URI has already been added
                    return; //Taglib already added... nothing to do
                }
                
                this.taglibUris[taglib.uri] = true; //Mark the taglib as added
                
                if (taglib.shortName) {
                    /*
                     * If the taglib has a short name then record that mapping so that we
                     * can map the short name to the full URI
                     */
                    this.taglibUris[taglib.shortName] = true; //Mark the short name as being a taglib
                    this.shortNameToUriMapping[taglib.shortName] = taglib.uri; //Add the mapping
                    this.uriToShortNameMapping[taglib.uri] = taglib.shortName; //Add the reverse-mapping
                }
                
                /*
                 * Index all of the tags in the taglib by registering them
                 * based on the tag URI and the tag name
                 */
                forEach(taglib.tags, function(tag) {
                    
                    var uri = tag.uri == null ? taglib.uri : tag.uri, //If not specified, the tag URI should be the same as the taglib URI
                        name = tag.name,
                        key = uri + ":" + name; //The taglib will be registered using the combination of URI and tag name
                    /*
                     * NOTE: Wildcards are supported for URI and tag name. The tag URI can be a asterisk to indicate 
                     *       that it matches any URI and similar for the tag name. 
                     */
                    
                    tag = extend(new Tag(), tag); //Convert the tag to an actual Tag class
                    tag.taglib = taglib; //Store a reference to the taglib that the tag belongs to
                    
                    this.tagDefs[key] = tag; //Register the tag using the combination of URI and tag name so that it can easily be looked up
                    
                    if (tag.transformers) { //Check if the tag has any transformers that should be applied
                        
                        var tagTransformersEntry; //A reference to the array of the tag transformers with the same key
                        
                        if (!(tagTransformersEntry = this.tagTransformersLookup[key])) { //Look up the existing transformers
                            this.tagTransformersLookup[key] = tagTransformersEntry = { //No transformers found so create a new entry
                                    transformers: [], //Initialize the transformers to an empty list
                                    before: {}, //This map will contain entries for transformers that should be invoked after a transformer of a certain class name (class names are keys)
                                    after: {}, //This map will contain entries for transformers that should be invoked before a transformer of a certain class name (class names are keys)
                                    _addRelativeTransformer: function(beforeAfter, transformer, relativeTo) {
                                        var existing = this[beforeAfter][relativeTo]; //There may be more than one transformer configured to be invoked before another transformer
                                        if (!existing) { 
                                            existing = this[beforeAfter][relativeTo] = [];
                                        }
                                        existing.push(transformer);
                                    }
                            };
                        }
                        
                        //Now add all of the transformers for the node (there will typically only be one...)
                        forEach(tag.transformers, function(transformer) {
                            
                            transformer = extend(new Transformer(), transformer); //Convert the transformer config to instance of Transformer
                            
                            if (transformer.after) { //Check if this transformer is configured to run after another transfrormer
                                tagTransformersEntry._addRelativeTransformer("after", transformer, transformer.after);
                            }
                            else if (transformer.before) { //Check if this transformer is configured to run after another transfrormer
                                tagTransformersEntry._addRelativeTransformer("before", transformer, transformer.before);
                            }
                            else {
                                tagTransformersEntry.transformers.push(transformer);  //The transformer is not configured to run before/after another transformer so just append it to the list                             
                            }
                            
                        }, this);
                    }
                    
                    
                }, this);
                
                /*
                 * Now register all of the text transformers that are part of the provided taglibs
                 */
                forEach(taglib.textTransformers, function(textTransformer) {
                    this.textTransformers.push(extend(new Transformer(), textTransformer));
                }, this);
            },
            
            /**
             * Invokes a callback for eaching matching transformer that is found for the current node.
             * If the provided node is an element node then the match is based on the node's
             * URI and the local name. If the provided node is a text node then all
             * text transformers will match.
             * 
             * @param node {templating.compiler$Node} The node to match transformers to
             * @param callback {Function} The callback function to invoke for each matching transformer
             * @param thisObj {Object} The "this" object to use when invoking the callback function
             */
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
            
            /**
             * Resolves a taglib short name to a taglib URI.
             * 
             * <p>
             * If the provided short name is not a known short name then it is just returned.
             * 
             * @param shortName {String} The taglib short name to resolve
             * @returns {String} The resolved URI or the input string if it is not a known short name
             */
            resolveURI: function(shortName) {
                if (!shortName) {
                    return shortName;
                }
                return this.shortNameToUriMapping[shortName] || shortName;
            },
            
            /**
             * Resolves a taglib URI to a taglib short name.
             * 
             * <p>
             * If the provided URI is not a known short name then it is just returned.
             * 
             * @param uri {String} The taglib uri to resolve to a short name
             * @returns {String} The resolved short name or the input string if there is not a known short name
             */
            resolveShortName: function(uri) {
                if (!uri) {
                    return uri;
                }
                return this.uriToshortNameMapping[uri] || uri;
            },
            
            /**
             * Invokes a provided callback for each tag transformer that
             * matches the provided URI and tag name.
             * 
             * @param uri {String} The tag URI or an empty string if the tag is not namespaced
             * @param tagName {String} The local name of the tag (e.g. "div")
             * @param callback {Function} The callback function to invoke
             * @param thisObj {Object} The "this" object to use when invoking the callback function
             */
            forEachTagTransformer: function(uri, tagName, callback, thisObj) {
                /*
                 * If the node is an element node then we need to find all matching
                 * transformers based on the URI and the local name of the element.
                 */
                
                if (uri == null) {
                    uri = '';
                }
                
                var _this = this,
                    /**
                     * Handle all of the transformers in the tag transformers entry
                     */
                    _handleTransformers = function(entry, transformers) {
                        if (!entry) { //If no entry then nothing to do
                            return;
                        }
                        
                        if (!transformers) {
                            transformers = entry.transformers; //If no transformers were provided then using the transformers in the entry
                        }
                        
                        if (!transformers) { //Check if there are any transformers
                            return;
                        }
                        /*
                         * Loop over all of the transformers and invoke the provided callback
                         */
                        for (var i=0, len=transformers.length; i<len; i++)
                        {
                            var transformer = transformers[i];
                            
                            if (entry.before[transformer.className]) {
                                _handleTransformers(entry, entry.before[transformer.className]); //Handle any transformers that are registered to be invoked before the current transformer
                            }
                            
                            if (callback.call(thisObj, transformer) === false) { //Invoke the callback and if the return value is "false" then stop
                                return;
                            }

                            if (entry.after[transformer.className]) {
                                _handleTransformers(entry, entry.after[transformer.className]); //Handle any transformers that are registered to be invoked after the current transformer 
                            }
                        };
                    };
                
                /*
                 * Handle all of the transformers for all possible matching transformers.
                 * 
                 * Start with the most specific and end with the list specific.
                 */
                _handleTransformers(this.tagTransformersLookup[uri + ":" + tagName]); //All transformers that match the URI and tag name exactly
                _handleTransformers(this.tagTransformersLookup[uri + ":*"]); //Wildcard for tag name but matching URI (i.e. transformers that apply to every element with a URI, regadless of tag name)
                _handleTransformers(this.tagTransformersLookup["*:*"]); //Wildcard for both URI and tag name (i.e. transformers that apply to every element)
            },
            
            /**
             * Invokes a provided callback for each registered text transformer.
             * 
             * @param callback {Function} The callback function to invoke
             * @param thisObj {Object} The "this" object to use when invoking the callback function
             */
            forEachTextTransformer: function(callback, thisObj) {
                forEach(this.textTransformers, function(textTransformer) {
                    var keepGoing = callback.call(thisObj, textTransformer);
                    if (keepGoing === false) {
                        return false;
                    }
                });
            },
            
            /**
             * Returns the definition of a tag that was loaded from the taglib with the specified
             * URI and with the matching 
             * @param uri
             * @param localName
             * @returns
             */
            getTagDef: function(uri, localName) {
                var tagDef = this.tagDefs[uri + ":" + localName];
                if (!tagDef) {
                    this.tagDefs[uri + ":*"]; //See if there was a wildcard tag definition in the taglib
                }
                return tagDef;
            }
        };
        
        return TaglibCollection;
    });
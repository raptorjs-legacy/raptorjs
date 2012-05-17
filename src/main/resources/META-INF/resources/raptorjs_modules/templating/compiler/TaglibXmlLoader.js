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
    "templating.compiler.TaglibXmlLoader",
    function(raptor) {
        "use strict";
        
        var objectMapper = raptor.require('xml.sax.objectMapper'),
            strings = raptor.require("strings"),
            Taglib = raptor.require('templating.compiler.Taglib'),
            STRING = "string",
            BOOLEAN = "boolean",
            OBJECT = "object",
            transformerUniqueId = 0;
        
        var TaglibXmlLoader = function(src, path) {
            this.src = src;
            this.filePath = path;
        };
        
        TaglibXmlLoader.load = function(src, filePath) {
            var loader = new TaglibXmlLoader(src, filePath);
            return loader.load();
        };
        
        
        
        TaglibXmlLoader.prototype = {
            load: function() {
                var src = this.src, 
                    filePath = this.filePath,
                    logger = this.logger();

                return objectMapper.read(
                    src, 
                    filePath,  
                    {
                        "raptor-taglib": { 
                            _type: OBJECT,
                            
                            _begin: function() {
                                return {
                                    uri: null,
                                    shortName: null
                                };
                            },
                            
                            "tlib-version": {
                                _type: STRING,
                                _targetProp: "version"
                            },
                            "short-name": {
                                _type: STRING,
                                _targetProp: "shortName"
                            },
                            "uri": {
                                _type: STRING
                            },
                            
                            "tag": {
                                _type: OBJECT,
                                
                                _begin: function(taglib) {
                                    return {
                                        name: null,
                                        uri: null,
                                        handlerClass: null,
                                        dynamicAttributes: false
                                    };
                                },
                                
                                _end: function(tag, taglib) {
                                    if (tag.uri == null) {
                                        tag.uri = taglib.uri;
                                    }

                                    if (!taglib.tags) {
                                        taglib.tags = [];
                                    }
                                    taglib.tags.push(tag);
                                },
                                
                                "name": {
                                    _type: STRING,
                                    _targetProp: "name"
                                },
                                "uri": {
                                    _type: STRING,
                                    _begin: function(tag) {
                                        tag.uri = '';
                                    }
                                },
                                "handler-class": {
                                    _type: STRING,
                                    _targetProp: "handlerClass"
                                },
                                "node-compiler-class": {
                                    _type: STRING,
                                    _targetProp: "nodeCompilerClass"
                                },
                                "dynamic-attributes": {
                                    _type: BOOLEAN,
                                    _targetProp: "dynamicAttributes"
                                },
                                
                                "attribute": {
                                    _type: OBJECT,
                                    
                                    _begin: function() {
                                        return {
//                                            name: null,
//                                            uri: null,
//                                            required: null,
                                            type: "string"
                                        };
                                    },
                                    _end: function(attr, tag) {
                                        if (!tag.attributeMap) {
                                            tag.attributeMap = {};
                                        }
                                        var uri = attr.uri || '';
                                        tag.attributeMap[uri + ':' + attr.name] = attr;
                                    },
                                    
                                    "name": {
                                        _type: STRING
                                    },
                                    
                                    "uri": {
                                        _type: STRING
                                    },
                                    
                                    "required": {
                                        _type: BOOLEAN
                                    },
                                    
                                    "type": {
                                        _type: STRING
                                    },
                                    
                                    "allow-expressions": {
                                        _type: BOOLEAN,
                                        _targetProp: "allowExpressions"
                                    }
                                },
                                "nested-variable": {
                                    _type: OBJECT,
                                    
                                    _begin: function() {
                                        return {
                                            name: null
                                        };
                                    },
                                    _end: function(nestedVariable, tag) {
                                        if (!tag.nestedVariables) {
                                            tag.nestedVariables = [];
                                        }
                                        tag.nestedVariables.push(nestedVariable);
                                    },
                                    
                                    "name": {
                                        _type: STRING,
                                        _targetProp: "name"
                                    }
                                },
                                
                                "imported-variable": {
                                    _type: OBJECT,
                                    
                                    _begin: function() {
                                        return {
                                            propertyName: null,
                                            expression: null
                                        };
                                    },
                                    _end: function(importedVariable, tag) {
                                        if (!tag.importedVariables) {
                                            tag.importedVariables = [];
                                        }
                                        tag.importedVariables.push(importedVariable);
                                    },
                                    
                                    "property-name": {
                                        _type: STRING,
                                        _targetProp: "propertyName"
                                    },
                                    
                                    "expression": {
                                        _type: STRING
                                    }
                                },
                                
                                "transformer": {
                                    _type: OBJECT,
                                    
                                    _begin: function(taglib) {
                                        return {
                                            id: transformerUniqueId++,
                                            className: null,
                                            path: null
                                        };
                                    },
                                    
                                    _end: function(transformer, tag) {
                                        if (!tag.transformers) {
                                            tag.transformers = [];
                                        }
                                        tag.transformers.push(transformer);
                                    },
                                    
                                    "class-name": {
                                        _type: STRING,
                                        _targetProp: "className"
                                    },
                                    
                                    "after": {
                                        _type: STRING,
                                        _targetProp: "after"
                                    },
                                    
                                    "before": {
                                        _type: STRING,
                                        _targetProp: "before"
                                    }
                                }
                            },
                            //end "tag"
                            
                            "text-transformer": {
                                _type: OBJECT,
                                
                                _begin: function() {
                                    return {
                                        id: transformerUniqueId++,
                                        className: null,
                                        path: null
                                    };
                                },
                                
                                _end: function(textTransformer, taglib) {
                                    if (!taglib.textTransformers) {
                                        taglib.textTransformers = [];
                                    }
                                    taglib.textTransformers.push(textTransformer);
                                },
                                
                                "class-name": {
                                    _type: STRING,
                                    _targetProp: "className"
                                }
                            },
                            
                            "import-taglib": {
                                _type: OBJECT,
                                
                                _begin: function() {
                                    raptor.errors.throwError(new Error("<import-taglib> no yet supported"));
                                },
                                
                                _end: function(textTransformer, taglib) {

                                },
                                
                                "uri": {
                                    _type: STRING
                                }
                            }
                            
                        }
                    });
            }
        };
        
        return TaglibXmlLoader;
        
    });
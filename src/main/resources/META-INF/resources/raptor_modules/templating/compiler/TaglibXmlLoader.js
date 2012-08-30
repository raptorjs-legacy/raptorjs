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
        
        var objectMapper = raptor.require('xml.sax.object-mapper'),
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
                    logger = this.logger(),
                    tagsById = {},
                    extendTag = function(subTag) {
                        var extendsId = subTag['extends'];
                        
                        delete subTag['extends'];
                        
                        var superTag = tagsById[extendsId];
                        if (!superTag) {
                            throw raptor.createError(new Error('Parent tag with ID "' + extendsId + '" not found in taglib at path "' + filePath + '"'));
                        }
                        
                        if (superTag['extends']) {
                            extendTag(superTag);
                        }
                        
                        /*
                         * Have the sub tag inherit any properties from the super tag that are not in the sub tag
                         */
                        raptor.forEachEntry(superTag, function(k, v) {
                            if (subTag[k] === undefined) {
                                subTag[k] = v;
                            }
                        });
                        
                        /*
                         * Copy any attributes from the super tag that are not found in the sub tag 
                         */
                        if (subTag.attributeMap && superTag.attributeMap && subTag.attributeMap !== superTag.attributeMap) {
                            raptor.forEachEntry(superTag.attributeMap, function(k, v) {
                                if (!subTag.attributeMap[k]) {
                                    subTag.attributeMap[k] = v;
                                }
                            });
                        }
                        else if (superTag.attributeMap) {
                            subTag.attributemap = superTag.attributeMap; 
                        }
                    },
                    handleExtends = function(tags) {

                        if (!tags) {
                            return;
                        }
                        
                        for (var i=0, len=tags.length; i<len; i++) {
                            var tag = tags[i];
                            if (tag['extends']) {
                                extendTag(tag);
                            }
                        }
                    };
                    
                var taglib;
                
                var handlers = {
                        "raptor-taglib": { 
                            _type: OBJECT,
                            
                            _begin: function() {
                                var newTaglib = {
                                        uri: null,
                                        shortName: null
                                    };
                                
                                if (!taglib) {
                                    taglib = newTaglib;
                                }
                                
                                
                                return newTaglib;
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
                            
                            "prefix": {
                                _type: STRING
                            },
                            
                            "tag": {
                                _type: OBJECT,
                                
                                _begin: function() {
                                    return {
//                                        name: null,
//                                        uri: null,
//                                        handlerClass: null,
//                                        dynamicAttributes: false
                                    };
                                },
                                
                                _end: function(tag) {
                                    if (tag.uri == null) {
                                        tag.uri = taglib.uri;
                                    }

                                    if (!taglib.tags) {
                                        taglib.tags = [];
                                    }
                                    
                                    if (tag.id) {
                                        tagsById[tag.id] = tag;
                                    }
                                    
                                    
                                    taglib.tags.push(tag);
                                },
                                
                                "name": {
                                    _type: STRING,
                                    _targetProp: "name"
                                },
                                "uri": {
                                    _type: STRING,
                                    _set: function(tag, name, value, context) {
                                        tag.uri = value || '';
                                    }
                                },
                                "id": {
                                    _type: STRING
                                },
                                "preserveSpace": {
                                    _type: BOOLEAN
                                },
                                "extends": {
                                    _type: STRING,
                                    _targetProp: "extends"
                                },
                                "handler-class": {
                                    _type: STRING,
                                    _targetProp: "handlerClass"
                                },
                                "compiler-class": {
                                    _type: STRING,
                                    _targetProp: "compilerClass"
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
                                        
                                        if (!nestedVariable.name) {
                                            throw raptor.createError(new Error('The "name" attribute is required for an imported variable'));
                                        }
                                        
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
                                        if (!importedVariable.propertyName) {
                                            throw raptor.createError(new Error('The "property-name" attribute is required for an imported variable'));
                                        }
                                        if (!importedVariable.expression) {
                                            throw raptor.createError(new Error('The "expression" attribute is required for an imported variable'));
                                        }
                                        
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
                                    
                                    _begin: function() {
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
                                    },
                                    
                                    "<properties>": {
                                        _type: OBJECT,
                                        
                                        _begin: function(parent) {
                                            return (parent.properties = {});
                                        },
                                        
                                        "<*>": {
                                            _type: STRING
                                        }
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
                                
                                _end: function(textTransformer) {
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
                                    return {};
                                    
                                },
                                
                                _end: function(importedTaglib) {
                                    var path = importedTaglib.path,
                                        taglibResource = raptor.require('resources').findResource(path),
                                        importedXmlSource;
                                    
                                    if (!taglibResource.exists()) {
                                        throw raptor.createError(new Error('Imported taglib with path "' + path + '" not found in taglib at path "' + filePath + '"'));
                                    }
                                    
                                    importedXmlSource = taglibResource.readFully();
                                    
                                    objectMapper.read(
                                            importedXmlSource, 
                                            taglibResource.getSystemPath(),  
                                            handlers);
                                    
                                },
                                
                                "path": {
                                    _type: STRING
                                }
                            },
                            
                            "function": {
                                _type: OBJECT,
                                
                                _begin: function() {
                                    return {
                                        
                                    };
                                },
                                
                                _end: function(func) {
                                    if (!taglib.functions) {
                                        taglib.functions = [];
                                    }
                                    taglib.functions.push(func);
                                },
                                
                                "name": {
                                    _type: STRING
                                },
                                
                                "class": {
                                    _type: STRING,
                                    _targetProp: "functionClass"
                                },
                                
                                "bind-to-context": {
                                    _type: BOOLEAN,
                                    _targetProp: "bindToContext"
                                }
                            }
                            
                        }
                    };
                
                objectMapper.read(
                    src, 
                    filePath,  
                    handlers);
                
                handleExtends(taglib.tags);
                
                return taglib;
            }
        };
        
        return TaglibXmlLoader;
        
    });
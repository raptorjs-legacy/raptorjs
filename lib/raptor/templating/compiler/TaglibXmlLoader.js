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

define.Class(
    "raptor/templating/compiler/TaglibXmlLoader",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var objectMapper = require('raptor/xml/sax/object-mapper'),
            logger = module.logger(),
            regexp = require('raptor/regexp'),
            Taglib = require('raptor/templating/compiler/Taglib'),
            Tag = Taglib.Tag,
            Attribute = Taglib.Attribute,
            NestedVariable = Taglib.NestedVariable,
            ImportedVariable = Taglib.ImportedVariable,
            Transformer = Taglib.Transformer,
            Function = Taglib.Function,
            STRING = "string",
            BOOLEAN = "boolean",
            OBJECT = "object";
        
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
                var attributeHandler = {
                        _type: OBJECT,
                        
                        _begin: function() {
                            return new Attribute(); 
                            
                        },
                        _end: function(attr, parent) {
                            parent.addAttribute(attr);
                        },
                        
                        "name": {
                            _type: STRING
                        },
                        
                        "pattern": {
                            _type: STRING,
                            _set: function(parent, name, value) {
                                var patternRegExp = regexp.simple(value);
                                parent.pattern = patternRegExp;
                            }
                        },
                        
                        "target-property": {
                            _type: STRING,
                            _targetProp: "targetProperty"
                        },
                        
                        "uri": {
                            _type: STRING
                        },
                        
                        "deprecated": {
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
                        },

                        "preserve-name": {
                            _type: BOOLEAN,
                            _targetProp: "preserveName"  
                        },

                        "description": {
                            _type: STRING
                        }
                    };
                
                var handlers = {
                        "raptor-taglib": { 
                            _type: OBJECT,
                            
                            _begin: function() {
                                var newTaglib = new Taglib();
                                
                                if (!taglib) {
                                    taglib = newTaglib;
                                }
                                
                                
                                return newTaglib;
                            },
                            
                            "attribute": attributeHandler,
                            
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
                                    return new Tag();
                                },
                                
                                _end: function(tag) {
                                    if (tag.uri === null) {
                                        tag.uri = taglib.uri;
                                    }
                                    
                                    taglib.addTag(tag);
                                    
                                    if (tag.id) {
                                        tagsById[tag.id] = tag;
                                    }
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
                                    _type: BOOLEAN,
                                    _targetProp: "preserveWhitespace"
                                },
                                "preserve-space": {
                                    _type: BOOLEAN,
                                    _targetProp: "preserveWhitespace"
                                },
                                "preserve-whitespace": {
                                    _type: BOOLEAN,
                                    _targetProp: "preserveWhitespace"
                                },
                                "preserveWhitespace": {
                                    _type: BOOLEAN,
                                    _targetProp: "preserveWhitespace"
                                },
                                "extends": {
                                    _type: STRING,
                                    _targetProp: "extends"
                                },
                                "handler-class": {
                                    _type: STRING,
                                    _targetProp: "handlerClass"
                                },
                                "renderer": {
                                    _type: STRING,
                                    _targetProp: "handlerClass"
                                },
                                "template": {
                                    _type: STRING,
                                    _targetProp: "template"
                                },
                                "node-class": {
                                    _type: STRING,
                                    _targetProp: "nodeClass"
                                },
                                "dynamic-attributes": {
                                    _type: BOOLEAN,
                                    _targetProp: "dynamicAttributes"
                                },
                                
                                "attribute": attributeHandler,
                                
                                "<nested-tag>": {
                                    _type: OBJECT,
                                    
                                    _begin: function() {
                                        return new Tag();
                                    },
                                    
                                    _end: function(nestedTag, tag) {
                                        if (nestedTag.uri === null || nestedTag.uri === undefined) {
                                            nestedTag.uri = taglib.uri;
                                        }
                                        
                                        nestedTag.targetProperty = nestedTag.targetProperty || nestedTag.name;
                                        
                                        if (!nestedTag.name) {
                                            throw raptor.createError(new Error('The "name" property is required for a <nested-tag>'));
                                        }
                                        
                                        tag.addNestedTag(nestedTag);
                                    },
                                    
                                    "name": {
                                        _type: STRING
                                    },
                                    
                                    "type": {
                                        _type: STRING
                                    },
                                    
                                    "target-property": {
                                        _type: STRING,
                                        _targetProp: "targetProperty"
                                    }
                                },
                                
                                "nested-variable": {
                                    _type: OBJECT,
                                    
                                    _begin: function() {
                                        return new NestedVariable();
                                    },
                                    _end: function(nestedVariable, tag) {
                                        
                                        if (!nestedVariable.name) {
                                            throw raptor.createError(new Error('The "name" attribute is required for a nested variable'));
                                        }

                                        tag.addNestedVariable(nestedVariable);
                                    },
                                    
                                    "name": {
                                        _type: STRING,
                                        _targetProp: "name"
                                    }
                                },
                                
                                "imported-variable": {
                                    _type: OBJECT,
                                    
                                    _begin: function() {
                                        return new ImportedVariable();
                                    },
                                    _end: function(importedVariable, tag) {
                                        if (!importedVariable.targetProperty) {
                                            throw raptor.createError(new Error('The "target-property" attribute is required for an imported variable'));
                                        }
                                        if (!importedVariable.expression) {
                                            throw raptor.createError(new Error('The "expression" attribute is required for an imported variable'));
                                        }
                                        tag.addImportedVariable(importedVariable);
                                    },
                                    
                                    "target-property": {
                                        _type: STRING,
                                        _targetProp: "targetProperty"
                                    },
                                    
                                    "expression": {
                                        _type: STRING
                                    }
                                },
                                
                                "transformer-class": {
                                    _type: STRING,
                                    _set: function(tag, name, value) {
                                        var transformer = new Transformer();
                                        transformer.className = value;
                                        tag.addTransformer(transformer);
                                    }
                                },
                                
                                "transformer": {
                                    _type: OBJECT,
                                    
                                    _begin: function() {
                                        return new Transformer();
                                    },
                                    
                                    _end: function(transformer, tag) {
                                        tag.addTransformer(transformer);
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
                                    return new Transformer();
                                },
                                
                                _end: function(textTransformer) {
                                    taglib.addTextTransformer(textTransformer);
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
                                        taglibResource = require('raptor/resources').findResource(path),
                                        importedXmlSource;
                                    
                                    if (!taglibResource.exists()) {
                                        throw raptor.createError(new Error('Imported taglib with path "' + path + '" not found in taglib at path "' + filePath + '"'));
                                    }
                                    
                                    importedXmlSource = taglibResource.readAsString();
                                    
                                    objectMapper.read(
                                            importedXmlSource, 
                                            taglibResource.getURL(),  
                                            handlers);
                                    
                                },
                                
                                "path": {
                                    _type: STRING
                                }
                            },
                            
                            "function": {
                                _type: OBJECT,
                                
                                _begin: function() {
                                    return new Function();
                                },
                                
                                _end: function(func) {
                                    taglib.addFunction(func);
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
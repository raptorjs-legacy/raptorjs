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
    "templating.taglibs.core.CoreTagTransformer",
    function(raptor) {
        "use strict";
        
        var extend = raptor.extend,
            forEach = raptor.forEach,
            coreNS = "http://raptorjs.org/templates/core",
            errors = raptor.errors,
            Node = raptor.require('templating.compiler.Node'),
            WriteNode = raptor.require('templating.taglibs.core.WriteNode'),
            ForNode = raptor.require("templating.taglibs.core.ForNode"),
            IfNode = raptor.require("templating.taglibs.core.IfNode"),
            WhenNode = raptor.require("templating.taglibs.core.WhenNode"),
            OtherwiseNode = raptor.require("templating.taglibs.core.OtherwiseNode"),
            TagHandlerNode = raptor.require("templating.taglibs.core.TagHandlerNode"),
            Expression = raptor.require('templating.compiler.Expression'),
            AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter'),
            TypeConverter = raptor.require('templating.compiler.TypeConverter'),
            getPropValue = function(value, type, allowExpressions) {
                return TypeConverter.convert(value, type, allowExpressions);
            };
        
        return {
            
            process: function(node, compiler) {
                
                var _this = this,
                    forEachAttr,
                    renderedIfAttr,
                    attrsAttr,
                    whenAttr,
                    parseBodyTextAttr,
                    stripAttr,
                    contentAttr,
                    replaceAttr,
                    replaced,
                    forEachProp = function(callback, thisObj) {
                        forEach(node.getAttributes(), function(attr) {

                            if (attr.uri=== 'http://www.w3.org/2000/xmlns/' || attr.uri === 'http://www.w3.org/XML/1998/namespace' || attr.prefix == 'xmlns') {
                                return; //Skip xmlns attributes
                            }
                            var prefix = attr.prefix;
                            
                            var attrUri = attr.prefix && (attr.uri != tagDef.taglib.uri) ? attr.uri : null;
                            
                            var attrDef = tagDef.getAttributeDef(attrUri, attr.localName);
                            if (!attrDef && attrUri) {
                                //Try again with the short name for the URI in that's how the attribute was defined
                                attrUri = compiler.taglibs.resolveShortName(attrUri);
                                attrDef = tagDef.getAttributeDef(attrUri, attr.localName);
                            }
                            var type = attrDef ? (attrDef.type || 'string') : 'string',
                                value,
                                uri = attr.uri;
                                
                            try
                            {
                                value = getPropValue(attr.value, type, attrDef ? attrDef.allowExpressions !== false : true);
                            }
                            catch(e) {
                                node.addError('Invalid attribute value of "' + attr.value + '" for attribute "' + attr.name + '": ' + e.message);
                                value = attr.value;
                            }
                                
                            if (uri === tagDef.taglib.uri) {
                                uri = '';
                                prefix = '';
                            }
                            
                            if (!attrDef && !tagDef.dynamicAttributes) {
                                //Tag doesn't allow dynamic attributes
                                node.addError('The tag "' + tagDef.name + '" in taglib "' + uri + '" does not support attribute "' + attr + '"');
                            }
                            
                            callback.call(thisObj, uri, attr.localName, value, prefix, attrDef);
                        }, this);
                    };
                
                
                if ((parseBodyTextAttr = node.getAttributeNS(coreNS, "parseBodyText")) != null) {
                    node.removeAttributeNS(coreNS, "parseBodyText");
                    node.parseBodyText = parseBodyTextAttr !== "false";
                }
                if ((whenAttr = node.getAttributeNS(coreNS, "when")) != null) {
                    node.removeAttributeNS(coreNS, "when");

                    var whenNode = new WhenNode({test: new Expression(whenAttr), pos: node.getPosition()});
                    node.parentNode.replaceChild(whenNode, node);
                    whenNode.appendChild(node);
                }
                
                if (node.getAttributeNS(coreNS, "otherwise") != null) {
                    node.removeAttributeNS(coreNS, "otherwise");

                    var otherwiseNode = new OtherwiseNode({pos: node.getPosition()});
                    node.parentNode.replaceChild(otherwiseNode, node);
                    otherwiseNode.appendChild(node);
                }
                
                if ((attrsAttr = node.getAttributeNS(coreNS, "attrs")) != null) {
                    node.removeAttributeNS(coreNS, "attrs");
                    node.dynamicAttributesExpression = attrsAttr;
                }
                
                if ((forEachAttr = node.getAttributeNS(coreNS, "for")) != null) {
                    node.removeAttributeNS(coreNS, "for");
                    var forEachProps = AttributeSplitter.parse(
                            forEachAttr, 
                            {
                                each: {
                                    type: "custom"
                                },
                                separator: {
                                    type: "expression"
                                },
                                varStatus: {
                                    type: "identifier"
                                }
                            },
                            {
                                defaultName: "each",
                                errorHandler: function(message) {
                                    node.addError('Invalid c:for attribute of "' + forEachAttr + '". Error: ' + message);
                                }
                            });
                    
                    forEachProps.pos = node.getPosition(); //Copy the position property
                    var forEachNode = new ForNode(forEachProps);

                    //Surround the existing node with an "forEach" node by replacing the current
                    //node with the new "forEach" node and then adding the current node as a child
                    node.parentNode.replaceChild(forEachNode, node);
                    forEachNode.appendChild(node);
                }

                if ((renderedIfAttr = node.getAttributeNS(coreNS, "if")) != null) {
                    node.removeAttributeNS(coreNS, "if");
                    
                    var ifNode = new IfNode({
                        test: new Expression(renderedIfAttr),
                        pos: node.getPosition()
                    });
                    
                    //Surround the existing node with an "if" node by replacing the current
                    //node with the new "if" node and then adding the current node as a child
                    node.parentNode.replaceChild(ifNode, node);
                    ifNode.appendChild(node);
                }
                
                if ((contentAttr = node.getAttributeNS(coreNS, "bodyContent")) != null) {
                    node.removeAttributeNS(coreNS, "bodyContent");
                    
                    var newChild = new WriteNode({expression: contentAttr, pos: node.getPosition()});
                    node.removeChildren();
                    node.appendChild(newChild);
                }
                
                if (node.getAttributeNS && (stripAttr = node.getAttributeNS(coreNS, "strip")) != null) {
                    node.removeAttributeNS(coreNS, "strip");
                    if (!node.setStripExpression) {
                        node.addError("The c:strip directive is not allowed for target node");
                    }
                    node.setStripExpression(stripAttr);
                }
                
                if (node.getAttributeNS && (replaceAttr = node.getAttributeNS(coreNS, "replace")) != null) {
                    node.removeAttributeNS(coreNS, "replace");
                    
                    var replaceWriteNode = new WriteNode({expression: replaceAttr, pos: node.getPosition()});
                    //Replace the existing node with an node that only has children
                    node.parentNode.replaceChild(replaceWriteNode, node);
                    node = replaceWriteNode;
                }
                
                
                
                var uri = node.uri;
                
                var tagDef = compiler.taglibs.getTagDef(uri, node.localName);
                if (tagDef) {
                    if (tagDef.preserveSpace) {
                        node.preserveSpace = true;
                    }
                    
                    if (tagDef.handlerClass)
                    {
                        //Instead of compiling as a static XML element, we'll
                        //make the node render as a tag handler node so that
                        //writes code that invokes the handler
                        TagHandlerNode.convertNode(
                            node, 
                            tagDef);
                        
                        forEachProp(function(uri, name, value, prefix, attrDef) {
                            if (attrDef) {
                                node.setPropertyNS(uri, name, value);    
                            }
                            else {
                                node.addDynamicAttribute(prefix ? prefix + ':' + name : name, value);
                            }
                            
                        });
                    }
                    else if (tagDef.compilerClass){
                        
                        var NodeCompilerClass = raptor.require(tagDef.compilerClass);
                        extend(node, NodeCompilerClass.prototype);
                        NodeCompilerClass.call(node);
                        
                        node.setNodeClass(NodeCompilerClass);
                        
                        forEachProp(function(uri, name, value) {
                            node.setPropertyNS(uri, name, value);
                        });
                    }
                    
                }
                else if (uri && compiler.taglibs.isTaglib(uri)) {
                    node.addError('Tag ' + node.toString() + ' is not allowed in taglib "' + uri + '"');
                }
            }
        };
    });
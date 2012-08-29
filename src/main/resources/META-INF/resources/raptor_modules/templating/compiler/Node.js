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
    'templating.compiler.Node',
    function(raptor) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            forEach = raptor.forEach,
            isArray = raptor.isArray,
            isEmpty = raptor.require('objects').isEmpty,
            splice = Array.prototype.splice,
            setParentNode = function(nodes, newParent) {
                forEach(nodes, function(node) {
                    if (node.parentNode) {
                        var removedChild = node.parentNode.removeChild(node);
                        if (!removedChild) {
                            throw raptor.createError(new Error("Unexpected state. Child not found in parent. (node=" + node + ", parentNode=" + newParent + ")"));
                        }
                    }
                    node.parentNode = newParent;
                }, this);
            };
        
        var Node = function(nodeType) {
            if (!this.nodeType) {
                this._isRoot = false;
                this.nodeType = nodeType;
                this.parentNode = null;
                this.childNodes = [];
                this.namespaceMappings = {};
                this.prefixMappings = {};
                this.transformersApplied = {};
                this.properties = {};
            }
        };
        
        Node.prototype = {
            getPosition: function() {
                var pos = this.pos || this.getProperty("pos") || {
                    toString: function() {
                        return "(unknown position)";
                    }
                };
                
                return pos;
                
            },
            addError: function(error) {
                if (!this.compiler) {
                    throw raptor.createError(new Error("Template compiler not set for node " + this));
                }
                var pos = this.getPosition();
                this.compiler.addError(error + " (" + this.toString() + ")", pos);
            },
            
            setProperty: function(name, value) {
                this.setPropertyNS(null, name, value);
            },
            
            setPropertyNS: function(uri, name, value) {
                if (!uri) {
                    uri = "";
                }
                var namespacedProps = this.properties[uri];
                if (!namespacedProps) {
                    namespacedProps = this.properties[uri] = {};
                }
                namespacedProps[name] = value;
            },
            
            setProperties: function(props) {
                this.setPropertiesNS(null, props);
            },
            
            setPropertiesNS: function(uri, props) {
                if (!uri) {
                    uri = "";
                }
                
                forEachEntry(props, function(name, value) {
                    this.setPropertyNS(uri, name, value);
                }, this);
            },
            
            getPropertyNamespaces: function() {
                return raptor.keys(this.properties);
            },
            
            getProperties: function(uri) {
                return this.getPropertiesNS(null);
            },
            
            getPropertiesNS: function(uri) {
                if (!uri) {
                    uri = "";
                }
                
                return this.properties[uri];
            },
            
            forEachProperty: function(callback, thisObj) {
                forEachEntry(this.properties, function(uri, properties) {
                    forEachEntry(properties, function(name, value) {
                        callback.call(thisObj, uri, name, value);
                    }, this);
                }, this);
            },
            
            getProperty: function(name) {
                return this.getPropertyNS(null, name);
            },
            
            getPropertyNS: function(uri, name) {
                if (!uri) {
                    uri = "";
                }
                
                var namespaceProps = this.properties[uri];
                return namespaceProps ? namespaceProps[name] : undefined;
            },
            
            removeProperty: function(name) {
                this.removePropertyNS("", name);
            },
            
            removePropertyNS: function(uri, name) {
                if (!uri) {
                    uri = "";
                }
                var namespaceProps = this.properties[uri];
                if (namespaceProps) {
                    delete namespaceProps[name];
                }
                
                if (isEmpty(namespaceProps)) {
                    delete this.properties[uri];
                }
                
            },
            
            forEachPropertyNS: function(uri, callback, thisObj) {
                if (uri == null) {
                    uri = '';
                }
                
                var props = this.properties[uri];
                if (props) {
                    forEachEntry(props, function(name, value) {
                        callback.call(thisObj, name, value);
                    }, this);
                }
            },
            
            forEachChild: function(callback, thisObj) {
                forEach(this.childNodes, callback, thisObj);
            },
        
            isTransformerApplied: function(transformer) {
                return this.transformersApplied[transformer.id] === true;
            },
            
            setTransformerApplied: function(transformer) {
                this.transformersApplied[transformer.id] = true;
            },
            
            hasChildren: function() {
                return this.childNodes.length > 0;
            },
            
            appendChild: function(childNode) {
                this.appendChildren([childNode]);
            },
            
            appendChildren: function(childNodes) {
                if (!childNodes) {
                    return;
                }
                
                if (!isArray(childNodes)) {
                    childNodes = [childNodes];
                }
                
                this.childNodes = this.childNodes.concat(childNodes);
                setParentNode(childNodes, this); //Remove the nodes from all of their existing parents and set the parent node to this node
                
            },
            
            isRoot: function() {
                return this._isRoot === true;
            },
            
            removeChild: function(childNode) {
                for (var i=0, len=this.childNodes.length, removedNode; i<len; i++) {
                    if ((removedNode = this.childNodes[i]) === childNode) {
                        childNode.parentNode = null;
                        this.childNodes.splice(i, 1);
                        return removedNode;
                    }
                }
                return null;
            },
            
            removeChildren: function() {
                setParentNode(this.childNodes, null);
                var childNodes = this.childNodes;
                this.childNodes = [];
                return childNodes;
            },

            replaceChild: function(newChild, replacedChild) {
                if (newChild === replacedChild) {
                    return false;
                }
                
                for (var i=0, len=this.childNodes.length; i<len; i++) {
                    if (this.childNodes[i] == replacedChild) {
                        setParentNode(newChild, this); //Remove the nodes from all of their existing parents and set the parent node to this node
                        
                        this.childNodes[i] = newChild;
                        replacedChild.parentNode = null; //Detach the replaced child from this parent node
                        return true;
                    }
                }
                return false;
            },
            
            insertAfter: function(nodes, referenceNode) {
                if (!nodes) {
                    return;
                }
                
                if (!isArray(nodes)) {
                    nodes = [nodes];
                }
                
                var childNodes = this.childNodes;
                
                if (referenceNode) {
                    for (var i=0, len=childNodes.length; i<len; i++) {
                        if (childNodes[i] === referenceNode) {
                            if (i === len - 1) {
                                break; //We found the reference node at the end... just append the children
                            }
                            else {
                                setParentNode(nodes, this); //Transfer the nodes to this parent
                                var spliceArgs = [i+1, 0].concat(nodes);
                                splice.apply(childNodes, spliceArgs); //Splice the new nodes into the child nodes
                                return;
                            }
                        }
                    }
                }
                
                this.appendChildren(nodes);
                
            },
            
            isTextNode: function() {
                return false;
            },
            
            isElementNode: function() {
                return false;
            },
            
            setStripExpression: function(stripExpression) {
                this.stripExpression = stripExpression;
            },
            
            generateCode: function(template) {
                this.compiler = template.compiler;
                
                var preserveSpace = this.preserveSpace || (this.isPreserveSpace && this.isPreserveSpace());
                
                if (preserveSpace) {
                    template.beginPreserveWhitespace();
                }
                try
                {
                    if (!this.stripExpression || this.stripExpression.toString() === 'false') {
                        this.doGenerateCode(template);
                    }
                    else if (this.stripExpression.toString() === 'true') {
                        this.generateCodeForChildren(template);
                    }
                    else {
                        //There is a strip expression
                        if (!this.generateBeforeCode || !this.generateAfterCode) {
                            this.addError("The c:strip directive is not supported for node " + this);
                            this.generateCodeForChildren(template);
                            return;
                        }
                        
                        var nextStripVarId = template.getAttribute("nextStripVarId");
                        if (nextStripVarId == null) {
                            nextStripVarId = template.setAttribute("nextStripVarId", 0);
                        }
                        var varName = '__strip' + (nextStripVarId++);
                        
                        template.addJavaScriptCode('var ' + varName + ' = !(' + this.stripExpression + ');\n');
                        
                        template.addJavaScriptCode('if (' + varName + ') {\n');
                        template.incIndent();
                        this.generateBeforeCode(template);
                        template.decIndent();
                        template.addJavaScriptCode('}\n');
                        
                        this.generateCodeForChildren(template);
                        
                        template.addJavaScriptCode('if (' + varName + ') {\n');
                        template.incIndent();
                        this.generateAfterCode(template, true /* indent */);
                        template.decIndent();
                        template.addJavaScriptCode('}\n');
                    }
                }
                catch(e) {
                    throw raptor.createError(new Error("Unable to generate code for node " + this + " at position [" + this.getPosition() + "]. Exception: " + e), e);
                }
                
                if (preserveSpace) {
                    template.endPreserveWhitespace();
                }
            },
            
            doGenerateCode: function(template) {
                
                this.generateCodeForChildren(template);
            },
            
            generateCodeForChildren: function(template, indent) {
                if (!template) {
                    throw raptor.createError(new Error('The "template" argument is required'));
                }
                if (indent === true) {
                    template.incIndent();
                }
                
                forEach(this.childNodes, function(childNode) {
                    childNode.generateCode(template);
                }, this);
                
                if (indent === true) {
                    template.decIndent();
                }
            },
            
            addNamespaceMappings: function(namespaceMappings) {
                if (!namespaceMappings) {
                    return;
                }
                var existingNamespaceMappings = this.namespaceMappings;
                var prefixMappings = this.prefixMappings;
                
                forEachEntry(namespaceMappings, function(prefix, uri) {
                    existingNamespaceMappings[prefix] = uri;
                    prefixMappings[uri] = prefix;
                });
            },
            
            resolveNamespacePrefix: function(uri) {
                var prefix = this.prefixMappings[uri];
                return (!prefix && this.parentNode) ?
                        this.parentNode.resolveNamespacePrefix() :
                        prefix;
            },
            
            getNodeClass: function() {
                return this.nodeClass || this.getClass();
            },
            
            setNodeClass: function(nodeClass) {
                this.nodeClass = nodeClass;
            }
        };
        
        return Node;
    });
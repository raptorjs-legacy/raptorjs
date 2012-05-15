raptor.defineClass(
    "templating.taglibs.core.CoreTagTransformer",
    function(raptor) {
        var extend = raptor.extend,
            forEach = raptor.forEach,
            stringify = raptor.require('json.stringify').stringify,
            coreNS = "http://ebay.com/raptor/core",
            errors = raptor.errors,
            Node = raptor.require('templating.compiler.Node'),
            WriteNode = raptor.require('templating.taglibs.core.WriteNode'),
            ForNode = raptor.require("templating.taglibs.core.ForNode"),
            IfNode = raptor.require("templating.taglibs.core.IfNode"),
            WhenNode = raptor.require("templating.taglibs.core.WhenNode"),
            OtherwiseNode = raptor.require("templating.taglibs.core.OtherwiseNode"),
            TagHandlerNode = raptor.require("templating.taglibs.core.TagHandlerNode"),
            Expression = raptor.require('templating.compiler.Expression'),
            ExpressionParser = raptor.require('templating.compiler.ExpressionParser'),
            AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter'),
            getPropValue = function(value, type, allowExpressions) {
                 
                
                var hasExpression = false,
                    expressionParts = [];
                
                if (type === 'expression') {
                    return new Expression(value);
                }
                
                if (allowExpressions) {
                    ExpressionParser.parse(value, {
                        text: function(text) {
                            expressionParts.push(stringify(text));
                        },
                        
                        expression: function(expression) {
                            expressionParts.push(expression);
                            hasExpression = true;
                        }
                    });
                    
                    if (hasExpression) {
                        return new Expression(expressionParts.join("+"));
                    }
                }
                
                if (type === 'string') {
                    return allowExpressions ? new Expression(value ? stringify(value) : "null") : value;
                }
                else if (type === 'boolean') {
                    value = value.toLowerCase();
                    value = value === 'true' || value === 'yes'; //convert it to a boolean
                    return allowExpressions ? new Expression(value) : value;
                }
                else if (type === 'float' || type === 'double' || type === 'number' || type === 'integer') {
                    if (type === 'integer') {
                        value = parseInt(value);
                    }
                    else {
                        value = parseFloat(value);
                    }
                    return allowExpressions ? new Expression(value) : value;
                }
                else if (type === 'custom' || type === 'identifier') {
                    return value;
                }
                else {
                    errors.throwError(new Error("Unsupported attribute type: " + type));
                }
                
                
            };
        
        return {
            
            process: function(node, compiler) {
                
                var forEachAttr,
                    renderedIfAttr,
                    attrsAttr,
                    whenAttr,
                    otherwiseAttr,
                    allowBodyExpressionsAttr,
                    stripAttr,
                    contentAttr,
                    replaceAttr,
                    replaced,
                    forEachProp = function(callback, thisObj) {
                        var props = {};
                        forEach(node.getAttributes(), function(attr) {

                            if (attr.uri=== 'http://www.w3.org/2000/xmlns/' || attr.prefix == 'xmlns') {
                                return; //Skip xmlns attributes
                            }
                            var attrDef = tagDef.getAttributeDef(attr.prefix && (attr.uri != tagDef.taglib.uri) ? attr.uri : null, attr.localName);
                            
                            var type = attrDef ? (attrDef.type || 'string') : 'string',
                                value = getPropValue(attr.value, type, attrDef ? attrDef.allowExpressions !== false : true),
                                uri = attr.prefix ? attr.uri : null;
                            
                            if (uri === tagDef.taglib.uri) {
                                uri = '';
                            }
                            
                            if (!attrDef && !tagDef.dynamicAttributes) {
                                //Tag doesn't allow dynamic attributes
                                if (!uri || !compiler.taglibs.isTaglib(uri)) {
                                    //The attribute is not part of another taglib so throw an error
                                    errors.throwError(new Error('The tag "' + tagDef.name + '" in tablib "' + tagDef.taglib.uri + '" does not support attribute "' + attr + '"'));
                                }
                                //We'll allow the attribute since it is part of another taglib...
                            }
                            
                            callback.call(thisObj, uri, attr.localName, value);
                        }, this);
                    };
                
                
                if ((allowBodyExpressionsAttr = node.getAttributeNS(coreNS, "allowBodyExpressions")) != null) {
                    node.removeAttributeNS(coreNS, "allowBodyExpressions");
                    node.allowBodyExpressions = allowBodyExpressionsAttr !== "false";
                }
                if ((whenAttr = node.getAttributeNS(coreNS, "when")) != null) {
                    node.removeAttributeNS(coreNS, "when");

                    var whenNode = new WhenNode({test: whenAttr});
                    replaced = node.parentNode.replaceChild(whenNode, node);
                    if (!replaced) {
                        errors.throwError(new Error('Unable to replace child'));
                    }
                    whenNode.appendChild(node);
                }
                
                if ((otherwiseAttr = node.getAttributeNS(coreNS, "otherwise")) != null) {
                    node.removeAttributeNS(coreNS, "otherwise");

                    var otherwiseNode = new OtherwiseNode({});
                    replaced = node.parentNode.replaceChild(otherwiseNode, node);
                    if (!replaced) {
                        errors.throwError(new Error('Unable to replace child'));
                    }
                    otherwiseNode.appendChild(node);
                }
                
                
                
                if ((attrsAttr = node.getAttributeNS(coreNS, "attrs")) != null) {
                    node.removeAttributeNS(coreNS, "attrs");
                    node.dynamicAttributesExpression = attrsAttr;
                }
                
                if ((forEachAttr = node.getAttributeNS(coreNS, "for")) != null) {
                    node.removeAttributeNS(coreNS, "for");
                    var forEachProps = AttributeSplitter.split(
                            forEachAttr, 
                            {
                                separator: {
                                    type: "expression"
                                }
                            },
                            {
                                defaultName: "each"
                            });
                    
                    var forEachNode = new ForNode(forEachProps);

                    //Surround the existing node with an "forEach" node by replacing the current
                    //node with the new "forEach" node and then adding the current node as a child
                    replaced = node.parentNode.replaceChild(forEachNode, node);
                    if (!replaced) {
                        errors.throwError(new Error('Unable to replace child'));
                    }
                    forEachNode.appendChild(node);
                }

                if ((renderedIfAttr = node.getAttributeNS(coreNS, "if")) != null) {
                    node.removeAttributeNS(coreNS, "if");
                    
                    var ifNode = new IfNode({
                        test: renderedIfAttr
                    });
                    
                    //Surround the existing node with an "if" node by replacing the current
                    //node with the new "if" node and then adding the current node as a child
                    node.parentNode.replaceChild(ifNode, node);
                    ifNode.appendChild(node);
                }
                
                if ((contentAttr = node.getAttributeNS(coreNS, "content")) != null) {
                    node.removeAttributeNS(coreNS, "content");
                    
                    var newChild = new WriteNode({expression: contentAttr});
                    node.removeChildren();
                    node.appendChild(newChild);
                }
                
                if ((stripAttr = node.getAttributeNS(coreNS, "strip")) != null) {
                    node.removeAttributeNS(coreNS, "strip");
                    
                    var newNode = new Node();
                    newNode.appendChildren(node.childNodes);
                    //Replace the existing node with an node that only has children
                    node.parentNode.replaceChild(newNode, node);
                    node = newNode;
                }
                
                if (node.getAttributeNS && (replaceAttr = node.getAttributeNS(coreNS, "replace")) != null) {
                    node.removeAttributeNS(coreNS, "replace");
                    
                    var replaceWriteNode = new WriteNode({expression: replaceAttr});
                    //Replace the existing node with an node that only has children
                    node.parentNode.replaceChild(replaceWriteNode, node);
                    node = replaceWriteNode;
                }
                
                var uri = node.uri;
                
                if (uri && compiler.taglibs.isTaglib(uri)) {
                    
                    var tagDef = compiler.taglibs.getTagDef(node.uri, node.localName);
                    if (tagDef) {
                        if (tagDef.handlerClass)
                        {
                            //Instead of compiling as a static XML element, we'll
                            //make the node render as a tag handler node so that
                            //writes code that invokes the handler
                            TagHandlerNode.convertNode(
                                node, 
                                tagDef);
                            
                            forEachProp(function(uri, name, value) {
                                node.setPropertyNS(uri, name, value);
                            });
                        }
                        else if (tagDef.nodeCompilerClass){
                            
                            var NodeCompilerClass = raptor.require(tagDef.nodeCompilerClass);
                            extend(node, NodeCompilerClass.prototype);
                            NodeCompilerClass.call(node);
                            
                            node.setNodeClass(NodeCompilerClass);
                            
                            forEachProp(function(uri, name, value) {
                                node.setPropertyNS(uri, name, value);
                            });
                        }
                        
                    }
                    else {
                        errors.throwError(new Error('Tag ' + node.toString() + ' is not allowed in taglib "' + uri + '"'));
                    }
                }
            }
        };
    });
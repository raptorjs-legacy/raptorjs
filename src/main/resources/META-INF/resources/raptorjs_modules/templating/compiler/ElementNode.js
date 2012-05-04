raptor.defineClass(
    'templating.compiler.ElementNode',
    'templating.compiler.Node',
    function() {
        var forEachEntry = raptor.forEachEntry,
            escapeXmlAttr = raptor.require("xml.utils").escapeXmlAttr,
            XML_URI = 'http://www.w3.org/XML/1998/namespace',
            ExpressionParser = raptor.require('templating.compiler.ExpressionParser');
        
        var ElementNode = function() {
            ElementNode.superclass.constructor.call(this, 'element');
            this.prefix = null;
            this.localName = null;
            this.uri = null;
            this.qName = null;
            this.dynamicAttributesExpression = null;
            this.attributes = {};

            this.allowSelfClosing = true;
            this.startTagOnly = false;
        };
        
        ElementNode.prototype = {
            setStartTagOnly: function(startTagOnly) {
                this.startTagOnly = true;
            },
            
            setAllowSelfClosing: function(allowSelfClosing) {
                this.allowSelfClosing = allowSelfClosing;
            },
            
            isElementNode: function() {
                return true;
            },
            
            isTextNode: function() {
                return false;
            },
            
            getAttributes: function() {
                var attributes = [];
                forEachEntry(this.attributes, function(name, attr) {
                    attributes.push(attr);
                }, this);
                return attributes;
            },
            
            getAttribute: function(name) {
                return this.getAttributeNS(null, name);
            },
            
            getAttributeNS: function(uri, localName) {
                var attr = this.attributes[(uri || '') + ":" + localName];
                return attr ? attr.value : null;
            },
            
            setAttribute: function(localName, value) {
                this.setAttributeNS(null, localName, value);
            },
            
            setAttributeNS: function(uri, localName, value, prefix) {
                this.attributes[(uri || '') + ":" + localName] = {
                    localName: localName,
                    value: value,
                    prefix: prefix,
                    uri: uri,
                    toString: function() {
                        return this.prefix ? (this.uri + ":" + this.localName) : this.localName;
                    }
                };
            },
            
            setEmptyAttribute: function(name) {
                this.setAttribute(name, null);
            },
            
            removeAttribute: function(localName) {
                this.removeAttributeNS(null, localName);
            },
            
            removeAttributeNS: function(uri, localName) {
                delete this.attributes[(uri || '') + ":" + localName];
            },
            
            isPreserveSpace: function() {
                return this.getAttributeNS(XML_URI, "space") === "preserve" || this.getAttribute("xml:space") === "preserve"; 
            },
            
            setPreserveSpace: function(preserve) {
                this.removeAttributeNS(XML_URI, "space");
                this.removeAttribute("space");
                
                if (preserve === true) {
                    this.setAttributeNS(XML_URI, "space", "preserve");
                }
            },
            
            
            doGenerateCode: function(template) {
                var preserveSpace = this.isPreserveSpace();
                
                var name = this.prefix ? (this.prefix + ":" + this.localName) : this.localName;
                
                if (preserveSpace) {
                    template.beginPreserveWhitespace();
                    this.setPreserveSpace(false);
                }
                
                template.addText("<" + name);
                if (this.attributes) {
                    forEachEntry(this.attributes, function(key, attr) {
                        template.addText(" ");
                        
                        var name;
                        
                        var prefix = attr.prefix;
                        if (!prefix && attr.uri) {
                            prefix = this.resolveNamespacePrefix(attr.uri);
                        }
                        
                        if (prefix) {
                            name = prefix + (attr.localName ? (":" + attr.localName) : "");
                        }
                        else {
                            name = attr.localName;
                        }
                        
                        if (attr.value === null || attr.value === undefined) {
                            template.addText(name);
                        }
                        else {
                            template.addText(name + '="');
                            
                            ExpressionParser.parse(
                                attr.value,
                                {
                                    text: function(text) {
                                        template.addText(escapeXmlAttr(text));
                                    },
                                    expression: function(expression) {
                                        template.addWrite(expression, {escapeXmlAttr: true});
                                    }
                                });
                            
                            template.addText('"');
                        }
                    }, this);
                }
                
                if (this.dynamicAttributesExpression) {
                    template.addJavaScriptCode(template.getContextHelperFunction("attrs", "a") + "(" + this.dynamicAttributesExpression + ");");
                }
                
                if (this.childNodes.length) {
                    template.addText(">");
                    
                    this.generateCodeForChildren(template);
                    
                    template.addText("</" + name + ">");
                }
                else {
                    if (this.startTagOnly) {
                        template.addText(">");
                    }
                    else if (this.allowSelfClosing) {
                        template.addText("/>");
                    }
                    else {
                        template.addText("></" + name + ">");
                    }
                }
                
                if (preserveSpace) {
                    template.endPreserveWhitespace();
                }
            },
            
            toString: function() {
                return "<" + (this.prefix ? (this.prefix + ":" + this.localName) : this.localName) + ">";
            }
        
        };
        
        return ElementNode;
    });
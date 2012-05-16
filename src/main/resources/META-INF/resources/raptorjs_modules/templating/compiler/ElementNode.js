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
            /**
             * 
             * @param startTagOnly
             */
            setStartTagOnly: function(startTagOnly) {
                this.startTagOnly = true;
            },
            
            /**
             * 
             * @param allowSelfClosing
             */
            setAllowSelfClosing: function(allowSelfClosing) {
                this.allowSelfClosing = allowSelfClosing;
            },
            
            /**
             * 
             * @returns {Boolean}
             */
            isElementNode: function() {
                return true;
            },
            
            /**
             * 
             * @returns {Boolean}
             */
            isTextNode: function() {
                return false;
            },
            
            /**
             * 
             * @returns {Array}
             */
            getAttributes: function() {
                var attributes = [];
                forEachEntry(this.attributes, function(name, attr) {
                    attributes.push(attr);
                }, this);
                return attributes;
            },
            
            /**
             * 
             * @param name
             * @returns
             */
            getAttribute: function(name) {
                return this.getAttributeNS(null, name);
            },
            
            /**
             * 
             * @param uri
             * @param localName
             * @returns
             */
            getAttributeNS: function(uri, localName) {
                var attr = this.attributes[(uri || '') + ":" + localName];
                return attr ? attr.value : null;
            },
            
            /**
             * 
             * @param localName
             * @param value
             */
            setAttribute: function(localName, value) {
                this.setAttributeNS(null, localName, value);
            },
            
            /**
             * 
             * @param uri
             * @param localName
             * @param value
             * @param prefix
             */
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
            
            /**
             * 
             * @param name
             */
            setEmptyAttribute: function(name) {
                this.setAttribute(name, null);
            },
            
            /**
             * 
             * @param localName
             */
            removeAttribute: function(localName) {
                this.removeAttributeNS(null, localName);
            },
            
            /**
             * 
             * @param uri
             * @param localName
             */
            removeAttributeNS: function(uri, localName) {
                delete this.attributes[(uri || '') + ":" + localName];
            },
            
            /**
             * 
             * @returns {Boolean}
             */
            isPreserveSpace: function() {
                return this.preserveSpace === true || this.getAttributeNS(XML_URI, "space") === "preserve" || this.getAttribute("xml:space") === "preserve"; 
            },
            
            removePreserveSpaceAttr: function() {
                this.removeAttributeNS(XML_URI, "space");
                this.removeAttribute("space");
            },
            
            /**
             * 
             * @param preserve
             */
            setPreserveSpace: function(preserve) {
                this.preserveSpace = preserve;
            },
            
            setStripExpression: function(stripExpression) {
                this.stripExpression = stripExpression;
            },
            
            /**
             * 
             * @param template
             */
            doGenerateCode: function(template) {
                this.generateBeforeCode(template);
                this.generateCodeForChildren(template);
                this.generateAfterCode(template);
            },
            
            generateBeforeCode: function(template) {
                var preserveSpace = this.preserveSpace = this.isPreserveSpace();
                
                var name = this.prefix ? (this.prefix + ":" + this.localName) : this.localName;
                
                if (preserveSpace) {
                    template.beginPreserveWhitespace();
                    this.removePreserveSpaceAttr();
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
                }
                else {
                    if (this.startTagOnly) {
                        template.addText(">");
                    }
                    else if (this.allowSelfClosing) {
                        template.addText("/>");
                    }
                }
            },
            
            generateAfterCode: function(template) {
                var preserveSpace = this.isPreserveSpace();
                
                var name = this.prefix ? (this.prefix + ":" + this.localName) : this.localName;
                
                if (this.childNodes.length) {
                    template.addText("</" + name + ">");
                }
                else {
                    if (!this.startTagOnly && !this.allowSelfClosing) {
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
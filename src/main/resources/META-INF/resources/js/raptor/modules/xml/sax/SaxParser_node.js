raptor.defineClass(
    "xml.sax.SaxParser",
    "xml.sax.BaseSaxParser",
    function(raptor) {
        var sax = require("sax"),
            extend = raptor.extend,
            arrays = raptor.require("arrays"),
            forEachEntry = raptor.forEachEntry;

        
        var Attribute = function(nodeAttr) {
            this.nodeAttr = nodeAttr;
        };
        
        Attribute.prototype = {

            getURI: function() {
                var attr = this.nodeAttr;
                return attr.prefix ? attr.uri : '';
            },

            getLocalName: function() {
                return this.nodeAttr.local;
            },

            getQName: function() {
                var attr = this.nodeAttr;
                return attr.prefix ? attr.prefix + ":" + attr.local : attr.local;
            },

            getValue: function() {
                return this.nodeAttr.value;
            },

            getPrefix: function() {
                return this.nodeAttr.prefix;
            }
        };
        
        var Element = function(nodeElement) {
            this.nodeElement = nodeElement;
            this.attributes = null;
        };
        
        Element.prototype = {

            getURI: function() {
                return this.nodeElement.uri;
            },

            getLocalName: function() {
                return this.nodeElement.local;
            },

            getQName: function() {
                var node = this.nodeElement;
                return node.prefix ? node.prefix + ":" + node.local : node.local;
            },

            getPrefix: function() {
                return this.nodeElement.prefix;
            },
            
            getAttributes: function() {
                
                if (!this.attributes) {
                    this.attributes = [];
                    
                    forEachEntry(this.nodeElement.attributes, function(name, nodeAttr) {
                        this.attributes.push(new Attribute(nodeAttr));
                    }, this);
                    
                }
                return this.attributes;
            },
            
            getNamespaceMappings: function() {
                return this.nodeElement.ns;
            }
        };
        
        
        
        var SaxParser = function(options) {
            SaxParser.superclass.constructor.call(this, options);
            
            this.nodeParser = sax.parser(true /*strict*/, {
                trim: options.trim === true,
                normalize: options.normalize === true,
                lowercasetags: false,
                xmlns: true
            });
            
            var _this = this,
                stack = [];
            
            extend(this.nodeParser, {
                onerror: function(e) {
                    _this._error(e);
                },
                
                ontext: function(t) {
                    //console.error("ontext: " + t);
                    _this._characters(t);
                },
                
                onopentag: function (node) {
                    
                    var el = new Element(node);
                    //console.error("onopentag: " + el.getQName());
                    
                    stack.push(el);
                    _this._startElement(el);
                },


                onclosetag: function () {
                    
                    var el = arrays.pop(stack);
                    //console.error("onclosetag: " + el.getQName());
                    _this._endElement(el);
                },

                comment: function (comment) {
                    _this._comment(comment);
                }
            });
        };
        
        SaxParser.prototype = {
                
            parse: function(xmlSrc, filePath) {
                this.filePath = filePath;
                this.nodeParser.write(xmlSrc).close();
            },
            
            getPos: function() {
                var nodeParser = this.nodeParser,
                    filePath = this.filePath;
                
                return {
                    line: nodeParser.line,
                    column: nodeParser.column,
                    filePath: filePath,
                    toString: function() {
                        return this.filePath + ":" + this.line + ":" + this.column;
                    }
                    
                };
            }
        };
        
        return SaxParser;
        
    });
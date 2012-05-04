raptor.defineClass(
    'templating.compiler.ParseTreeBuilder',
    function() {
        
        var sax = raptor.require("xml.sax"),
            forEach = raptor.forEach,
            TextNode = raptor.require('templating.compiler.TextNode'),
            ElementNode = raptor.require('templating.compiler.ElementNode'),
            CORE_UI = "http://ebay.com/raptor/core";
            
          
        var ParseTreeBuilder = function() {
        };
        
        ParseTreeBuilder.parse = function(src, filePath) {
            var builder = new ParseTreeBuilder();
            return builder.parse(src, filePath);
        };
        
        ParseTreeBuilder.prototype = {
            parse: function(src, filePath) {
                var logger = this.logger(),
                    parentNode = null,
                    rootNode = null,
                    prevTextNode = null;
                
                var parser = sax.parser({
                        trim: false,
                        normalize: false
                    });
                
                
                parser.on({
                    error: function(e) {
                        raptor.throwError(e);
                    },
                    
                    characters: function(t) {
                        if (!parentNode) {
                            return; //Some bad XML parsers allow text after the ending element...
                        }
                        if (prevTextNode) {
                            prevTextNode.text += t;
                        }
                        else {
                            prevTextNode = new TextNode(t);
                            prevTextNode.pos = parser.getPos();
                            parentNode.appendChild(prevTextNode);
                        }
                        
                    },
                    
                    startElement: function(el) {
                        prevTextNode = null;
                        
                        var elementNode = new ElementNode();
                        elementNode.prefix = el.getPrefix();
                        elementNode.localName = el.getLocalName();
                        elementNode.qName = el.getQName();
                        elementNode.uri = el.getURI();
                        elementNode.addNamespaceMappings(el.getNamespaceMappings());
                        
                        elementNode.pos = parser.getPos();
                        
                        forEach(el.getAttributes(), function(attr) {
                            elementNode.setAttributeNS(attr.getURI(), attr.getLocalName(), attr.getValue(), attr.getPrefix());
                        });
                        
                        if (parentNode) {
                            parentNode.appendChild(elementNode);
                        }
                        else {
                            rootNode = elementNode;
                        }
                        
                        parentNode = elementNode;
                    },
                    
                    endElement: function () {
                        prevTextNode = null;
                        
                        parentNode = parentNode.parentNode;
                    }
                }, this);
                
                parser.parse(src, filePath);
                
                rootNode._isRoot = true;
                
                return rootNode;
            },
            
            getRootNode: function() {
                return this.rootNode;
            }
        };
        
        return ParseTreeBuilder;
    });
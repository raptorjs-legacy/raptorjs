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
        
        ParseTreeBuilder.parse = function(src, filePath, taglibs) {
            var builder = new ParseTreeBuilder();
            return builder.parse(src, filePath, taglibs);
        };
        
        ParseTreeBuilder.prototype = {
            /**
             * @param src {String} The XML source code to parse
             * @param src {String} The file path (for debugging and error reporting purposes)
             * @param taglibs {templating.compiler$TaglibCollection} The taglib collection. Required for resolving taglib URIs when short names are used. 
             */
            parse: function(src, filePath, taglibs) {
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
                        elementNode.uri = taglibs.resolveURI(el.getURI());
                        elementNode.addNamespaceMappings(el.getNamespaceMappings());
                        
                        elementNode.pos = parser.getPos();
                        
                        forEach(el.getAttributes(), function(attr) {
                            elementNode.setAttributeNS(taglibs.resolveURI(attr.getURI()), attr.getLocalName(), attr.getValue(), attr.getPrefix());
                        }, this);
                        
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
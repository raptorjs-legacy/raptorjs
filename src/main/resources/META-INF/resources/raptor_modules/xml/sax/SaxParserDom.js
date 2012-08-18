raptor.defineClass(
    'xml.sax.SaxParserDom',
    'xml.sax.BaseSaxParser',
    function(raptor) {
        "use strict";
        
        var SaxParserDom = function(xmlDoc) {
            SaxParserDom.superclass.constructor.call(this);
        };
        
        SaxParserDom.prototype = {
            parse: function(xmlSrc, filePath) {
                var xmlDoc;
                if (xmlSrc.documentElement) {
                    xmlDoc = xmlSrc;
                }
                else {
                    var parser = raptor.require('xml.dom').createParser();
                    xmlDoc = parser.parse(xmlSrc, filePath);    
                }
                
                raptor.require('xml.dom-to-sax').domToSax(xmlDoc.documentElement, {
                    
                    startElement: this._startElement,
                    
                    endElement: this._endElement,
                    
                    comment: this._comment,
                    
                    characters: this._characters
                }, this);
            }
        };
        
        return SaxParserDom;
    });
define.Class(
    'raptor/xml/sax/SaxParserDom',
    'raptor/xml/sax/BaseSaxParser',
    ['raptor'],
    function(raptor, require) {
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
                    var parser = require('raptor/xml/dom').createParser();
                    xmlDoc = parser.parse(xmlSrc, filePath);    
                }
                
                require('raptor/xml/dom-to-sax').domToSax(xmlDoc.documentElement, {
                    
                    startElement: this._startElement,
                    
                    endElement: this._endElement,
                    
                    comment: this._comment,
                    
                    characters: this._characters
                }, this);
            }
        };
        
        return SaxParserDom;
    });
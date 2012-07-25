raptor.defineClass(
    'xml.sax.SaxParser',
    'xml.sax.BaseSaxParser',
    function(raptor) {
        var SaxParser = function(xmlDoc) {
            SaxParser.superclass.constructor.call(this);
        };
        
        SaxParser.prototype = {
            parse: function(xmlSrc, filePath) {
                var parser = raptor.require('xml.dom').createParser();
                var xmlDoc = parser.parse(xmlSrc, filePath);
                raptor.require('xml.dom-to-sax').domToSax(xmlDoc.documentElement, {
                    
                    startElement: this._startElement,
                    
                    endElement: this._endElement,
                    
                    comment: this._comment,
                    
                    characters: this._characters
                }, this);
            }
        };
        
        return SaxParser;
    });
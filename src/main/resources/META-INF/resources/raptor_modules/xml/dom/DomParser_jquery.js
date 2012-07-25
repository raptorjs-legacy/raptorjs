raptor.defineClass(
    'xml.dom.DomParser',
    function(raptor) {
        var DomParser = function(options) {
            
        };
        
        DomParser.prototype = {
                
            parse: function(xmlSrc) {
                var xmlDoc = $.parseXML(xmlSrc);
                return xmlDoc;
            }
        };
        
        return DomParser;
    });
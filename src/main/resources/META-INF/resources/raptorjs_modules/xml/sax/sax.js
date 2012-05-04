raptor.defineModule(
    "xml.sax",
    function() {
        
        return {
            
            /**
             * 
             * @param options
             * @returns
             */
            parser: function(options) {
                var SaxParser = raptor.require("xml.sax.SaxParser");
                return new SaxParser(options);
            }
        };
        
    });
raptor.defineClass(
    "xml.Attribute",
    function(raptor) {
        var Attribute = function(uri, localName, qName, prefix, value) {
        };
        
        Attribute.prototype = {
                
            /**
             * 
             * @returns
             */
            getURI: function() {
                return this.uri;
            },
            
            /**
             * 
             * @returns
             */
            getLocalName: function() {
                return this.localName;
            },
            
            /**
             * 
             * @returns
             */
            getQName: function() {
                return this.qName;
            },
            
            /**
             * 
             * @returns
             */
            getValue: function() {
                return this.value;
            }
        };
        
        return Attribute;
    });
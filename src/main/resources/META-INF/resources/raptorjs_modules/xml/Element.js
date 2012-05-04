raptor.defineClass(
    "xml.Element",
    function(raptor) {
        var Element = function(uri, localName, qName, prefix) {
            this.uri = uri;
            this.localName = localName;
            this.qName = qName;
        };
        
        Element.prototype = {
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
             */
            getPrefix: function() {
                
            },
            
            /**
             * @return {Array<xml$Attribute>}
             */
            getAttributes: function() {
                
            },
            
            /**
             * 
             */
            getNamespaceMappings: function() {
                
            }
        };
        
        return Element;
    });
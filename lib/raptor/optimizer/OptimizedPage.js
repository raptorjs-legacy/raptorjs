define.Class(
    'raptor/optimizer/OptimizedPage',
    function(require) {
        "use strict";
        
        var OptimizedPage = function(htmlBySlot, loaderMetadata) {
            this.htmlBySlot = htmlBySlot;
            this.loaderMetadata = loaderMetadata;
        };
        
        OptimizedPage.prototype = {
            getHtmlBySlot: function() {
                return this.htmlBySlot;
            },
            
            getLoaderMetadata: function() {
                return this.loaderMetadata;
            },
            
            getSlotHtml: function(slot) {
                return this.htmlBySlot[slot];
            },
            
            toJSON: function() {
                return JSON.stringify(this.htmlBySlot);
            }
        };
        
        return OptimizedPage;
        
        
    });
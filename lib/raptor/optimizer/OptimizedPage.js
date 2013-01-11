define.Class(
    'raptor/optimizer/OptimizedPage',
    function(require) {
        "use strict";
        
        var OptimizedPage = function() {
            this.htmlBySlot = {};
            this.loaderMetadata = null;
            this.urlsBySlot = {};
            this.urlsByContentType = {};
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
            },

            setHtmlBySlot: function(htmlBySlot) {
                this.htmlBySlot = htmlBySlot;
            },
            
            setLoaderMetadata: function(loaderMetadata) {
                this.loaderMetadata = loaderMetadata;
            },

            addUrl: function(url, slot, contentType) {
                var urlsForSlot = this.urlsBySlot[slot] || (this.urlsBySlot[slot] = []);
                urlsForSlot.push(url);

                var urlsForContentType = this.urlsByContentType[contentType] || (this.urlsByContentType[contentType] = []);
                urlsForContentType.push(url);
            },

            getJavaScriptUrls: function() {
                return this.urlsByContentType["application/javascript"] || [];
            },

            getCSSUrls: function() {
                return this.urlsByContentType["text/css"] || [];
            }
        };
        
        return OptimizedPage;
        
        
    });
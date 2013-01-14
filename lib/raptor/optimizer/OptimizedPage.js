define.Class(
    'raptor/optimizer/OptimizedPage',
    function(require) {
        "use strict";
        
        var OptimizedPage = function() {
            this.htmlBySlot = {};
            this.loaderMetadata = null;
            this.urlsBySlot = {};
            this.urlsByContentType = {};
            this.filesByContentType = {};
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

            addFile: function(filePath, contentType) {
                var filesForContentType = this.filesByContentType[contentType] || (this.filesByContentType[contentType] = []);
                filesForContentType.push(filePath);
            },

            getJavaScriptUrls: function() {
                return this.urlsByContentType["application/javascript"] || [];
            },

            getCSSUrls: function() {
                return this.urlsByContentType["text/css"] || [];
            },

            getJavaScriptFiles: function() {
                return this.filesByContentType["application/javascript"] || [];
            },

            getCSSFiles: function() {
                return this.filesByContentType["text/css"] || [];
            }
        };
        
        return OptimizedPage;
        
        
    });
define.Class(
    "raptor/optimizer/Bundle",
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var packaging = require('raptor/packaging'),
            forEach = raptor.forEach,
            crypto = require('crypto');
        
        var Bundle = function(name) {
            this.name = name;
            this.dependencies = [];
            this.slot = "body";
            this.contentType = null;
            this.written = false;
            
            this.checksum = undefined;
            this.inline = false;
            this.url = null;
            this.urlBuilder = null;

            this.code = null;
        };
        
        Bundle.prototype = {
            isInline: function() {
                return this.inline;
            },
            
            setInline: function(inline) {
                this.inline = inline === true;
            },
            
            addDependency: function(dependency) {
            
                this.dependencies.push(packaging.createDependency(dependency));
            },
            
            getDependencies: function() {
                return this.dependencies;
            },
            
            hasDependencies: function() {
                return this.dependencies.length !== 0;
            },
            
            getName: function() {
                return this.name;
            },
            
            getLabel: function() {
                var contentType;
                
                if (this.isJavaScript()) {
                    contentType = "js";
                }
                else if (this.isStyleSheet()) {
                    contentType = "css";
                }
                else {
                    contentType = this.getContentType();
                }
                return '"' + this.getName() + '" (' + contentType + ', ' + this.slot + (this.inline ? ', inline' : '') + ')';
            },
            
            getKey: function() {
                return this.slot + "/" + this.contentType + "/" + this.name + (this.inline ? '/inline' : '');
            },
            
            getSlot: function() {
                return this.slot;
            },
            
            setSlot: function(slot) {
                this.slot = slot;
            },
            
            getContentType: function() {
                return this.contentType;
            },
            
            setContentType: function(contentType) {
                this.contentType = contentType;
            },
            
            isJavaScript: function() {
                return this.contentType === 'application/javascript';
            },
            
            isStyleSheet: function() {
                return this.contentType === 'text/css';
            },
            
            forEachDependency: function(callback, thisObj) {
                forEach(this.dependencies, callback, thisObj);
            },
            
            getChecksum: function() {
                return this.checksum;
            },

            setChecksum: function(checksum) {
                this.checksum = checksum;
            },
            
            getCode: function() {
                return this.code;
            },

            setCode: function(code) {
                this.code = code;
            },
            
            isWritten: function() {
                return this.written;
            },
            
            setWritten: function(written) {
                this.written = written !== false;
            },

            setUrl: function(url) {
                this.url = url;
            },

            getUrl: function(context) {
                if (this.url != null) {
                    return this.url;    
                }
                else if (this.urlBuilder) {
                    return this.urlBuilder.buildBundleUrl(this, context);
                }
                else {
                    return undefined;
                }
            },

            setUrlBuilder: function(urlBuilder) {
                this.urlBuilder = urlBuilder;
            },

            getUrlBuilder: function() {
                return this.urlBuilder;
            }
            
        };
        
        return Bundle;
    });
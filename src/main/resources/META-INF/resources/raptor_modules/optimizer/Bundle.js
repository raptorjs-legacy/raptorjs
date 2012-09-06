raptor.defineClass(
    "optimizer.Bundle",
    function(raptor) {
        "use strict";
        
        var packager = raptor.packager,
            forEach = raptor.forEach,
            forEachEntry = raptor.forEachEntry,
            crypto = require('crypto');
        
        var Bundle = function(name) {
            this.name = name;
            this.includes = [];
            this.slot = "body";
            this.contentType = null;
            this.writtenToDisk = false;
            
            this._code = undefined;
            this._checksum = undefined;
        };
        
        Bundle.prototype = {
            isInline: function() {
                return false;
            },
            
            addInclude: function(include) {
            
                this.includes.push(packager.createInclude(include));
            },
            
            getIncludes: function() {
                return this.includes;
            },
            
            hasIncludes: function() {
                return this.includes.length !== 0;
            },
            
            getName: function() {
                return this.name;
            },
            
            getKey: function() {
                return this.slot + "/" + this.contentType + "/" + this.name;
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
            
            forEachInclude: function(callback, thisObj) {
                forEach(this.includes, callback, thisObj);
            },
            
            getChecksum: function() {
                throw new Error("getChecksum() not implemented");
            },
            
            getCode: function() {
                throw new Error("getCode() not implemented");
            },
            
            calculateChecksum: function(code) {
                
                var shasum = crypto.createHash('sha1');
                shasum.update(code || this.readCode());
                return shasum.digest('hex');
            },
            
            readCode: function(context) {
                var output = [];
                this.forEachInclude(function(include) {
                    var code = include.getCode(context);
                    if (code) {
                        output.push(code);    
                    }
                }, this);
                
                return output.join("\n");  
            },
            
            isWrittenToDisk: function() {
                return this.writtenToDisk;
            },
            
            setWrittenToDisk: function(writtenToDisk) {
                this.writtenToDisk = writtenToDisk !== false;
            }
            
        };
        
        return Bundle;
    });
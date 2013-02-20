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
            this.writtenToDisk = false;
            
            this._code = undefined;
            this._checksum = undefined;
            this.inline = false;
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
            
            forEachDependency: function(callback, thisObj) {
                forEach(this.dependencies, callback, thisObj);
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
                this.forEachDependency(function(dependency) {
                    var code = dependency.getCode(context);
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
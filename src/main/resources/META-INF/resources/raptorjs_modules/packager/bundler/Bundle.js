raptor.defineClass(
    "packager.bundler.Bundle",
    function(raptor) {
        var packager = raptor.packager,
            forEach = raptor.forEach,
            forEachEntry = raptor.forEachEntry,
            crypto = require('crypto');
        
        var Bundle = function(name) {
            this.name = name;
            this.includes = [];
            this.location = "body";
            this.contentType = null;
            
            this._code = undefined;
            this._checksum = undefined;
        };
        
        Bundle.prototype = {
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
                return this.location + "/" + this.contentType + "/" + this.name;
            },
            
            getLocation: function() {
                return this.location;
            },
            
            setLocation: function(location) {
                this.location = location;
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
            
            calculateChecksum: function() {
                var shasum = crypto.createHash('sha1');
                shasum.update(this.readCode());
                return shasum.digest('hex');
            },
            
            readCode: function() {
                var output = [];
                this.forEachInclude(function(include) {
                    output.push(include.getCode());
                }, this);
                
                return output.join("\n");  
            }
        };
        
        return Bundle;
    });
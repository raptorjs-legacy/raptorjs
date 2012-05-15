$rload(function(raptor) {
    /**
     * @parent packaging_Server
     */
    
    var forEach = raptor.forEach,
        forEachEntry = raptor.forEachEntry,
        regexp = raptor.regexp;
    
    /**
     * 
     */
    var ExtensionCollection = function(extensions) {
        this.extensionsLookup = {};
        this.extensionsArray = [];
        
        if (raptor.isArray(extensions)) {
            forEach(extensions, function(ext) {
                this.add(ext);
            }, this);
        }
        else if (typeof extensions === 'object') {
            forEachEntry(extensions, function(ext) {
                this.add(ext);
            }, this);
        }
    };
    
    ExtensionCollection.prototype = {
        /**
         * 
         * @param ext
         */
        add: function(ext) {
            this.extensionsLookup[ext] = true;
            this.extensionsArray.push(ext);
        },
        
        /**
         * 
         * @param ext
         * @returns {Boolean}
         */
        contains: function(ext) {
            return this.extensionsLookup[ext] === true;
        },
        
        /**
         * 
         * @param ext
         * @returns {Boolean}
         */
        containsMatch: function(ext) {
            var regExp;
            
            if (ext instanceof RegExp) {
                regExp = ext;
            }
            else if (ext === "*") {
                return this.extensionsArray.length !== 0;
            }
            else {
                regExp = regexp.simple(ext);
            }
            
            var extensions = this.extensionsArray;
            for (var i=0, len=extensions.length; i<len; i++) {
                if (regExp.test(extensions[i])) {
                    return true;
                }
            }
            
            return false;
        }
    };
    
    raptor.packaging.ExtensionCollection = ExtensionCollection;
});

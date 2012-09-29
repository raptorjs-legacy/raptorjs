raptor.defineClass(
    'optimizer.BundleConfig',
    function(raptor) {
        "use strict";
        
        var BundleConfig = function() {
            this.name = null;
            this.includes = [];
            this.enabled = true;
        };

        BundleConfig.prototype = {
            addInclude: function(include) {
                this.includes.push(include);
            },
            forEachInclude: function(callback, thisObj) {
                raptor.forEach(this.includes, callback, thisObj);
            },
            toString: function() {
                return "[BundleConfig name=" + this.name + ", includes=[" + this.includes.join(",") + "]]";
            }
        };
        
        return BundleConfig;
    });
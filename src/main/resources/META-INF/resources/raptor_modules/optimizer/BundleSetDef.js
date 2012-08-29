raptor.defineClass(
    'optimizer.BundleSetDef',
    function(raptor) {
        "use strict";
        
        var BundleSetDef = function(config) {
            this.name = "default";
            this.ref = null;
            this.children = [];
            this.bundleSetCache = {};
            
            if (config) {
                raptor.extend(this, config);
            }
        };

        BundleSetDef.prototype = {
            addChild: function(child) {
                this.children.push(child);
            },
            toString: function() {
                return "[BundleSetDef name=" + this.name + "]";
            },
            forEachChild: function(callback, thisObj) {
                raptor.forEach(this.children, callback, thisObj);
            },
            
            getBundleSetCache: function() {
                return this.bundleSetCache;
            }
        };
        
        return BundleSetDef;
    });

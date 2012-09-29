raptor.defineClass(
    'optimizer.BundleSetConfig',
    function(raptor) {
        "use strict";
        
        var nextId = 0;
        
        var BundleSetConfig = function(config) {
            if (!config) {
                config = {};
            }
            this._id = nextId++;
            this.name = config.name;
            this.ref = config.ref;
            this.enabled = config.enabled !== false;
            this.children = [];
        };

        BundleSetConfig.prototype = {
            addChild: function(child) {
                this.children.push(child);
            },
            toString: function() {
                return "[BundleSetConfig name=" + this.name + "]";
            },
            forEachChild: function(callback, thisObj) {
                raptor.forEach(this.children, callback, thisObj);
            }
        };
        
        return BundleSetConfig;
    });

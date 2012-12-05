define.Class(
    'raptor/optimizer/BundleConfig',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var BundleConfig = function() {
            this.name = null;
            this.dependencies = [];
            this.enabled = true;
        };

        BundleConfig.prototype = {
            addDependency: function(dependency) {
                this.dependencies.push(dependency);
            },
            forEachDependency: function(callback, thisObj) {
                raptor.forEach(this.dependencies, callback, thisObj);
            },
            toString: function() {
                return "[BundleConfig name=" + this.name + ", dependencies=[" + this.dependencies.join(",") + "]]";
            }
        };
        
        return BundleConfig;
    });
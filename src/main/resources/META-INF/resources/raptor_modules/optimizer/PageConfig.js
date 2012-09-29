raptor.defineClass(
    'optimizer.PageConfig',
    function(raptor) {
        "use strict";
        
        var PageConfig = function() {
            this.name = null;
            this.bundleSetConfig = null;
        };

        PageConfig.prototype = {

            getBundleSetConfig: function() {
                return this.bundleSetConfig;
            },
            
            addBundleSetConfig: function(bundleSetConfig) {
                if (this.bundleSetConfig) {
                    throw raptor.createError(new Error('Page "' + this.name + '" already has bundles defined"'));
                }
                
                this.bundleSetConfig = bundleSetConfig;
            },
            toString: function() {
                return "[PageConfig name=" + this.name + "]";
            }
        };
        
        return PageConfig;
    });

define.Class(
    'raptor/optimizer/Cache',
    function(require) {
        "use strict";
        
        var Cache = function() {
            this.optimizedPageCache = {};
            this.bundleMappingsCache = {};
        };
        
        Cache.prototype = {

            getOptimizedPage: function(pageKey) {
                return this.optimizedPageCache[pageKey]; 
            },
            
            addOptimizedPage: function(pageKey, optimizedPage) {
                this.optimizedPageCache[pageKey] = optimizedPage;
            },
            
            getBundleMappings: function(id) {
                return this.bundleMappingsCache[id];
            },
            
            addBundleMappings: function(id, bundleMappings) {
                this.bundleMappingsCache[id] = bundleMappings;
            }
        };
        
        return Cache;
        
        
    });
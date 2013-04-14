define.Class(
    'raptor/optimizer/Cache',
    function(require) {
        "use strict";

        
        var Cache = function(cacheProvider, enabledExtensions) {
            var key = enabledExtensions ? enabledExtensions.getKey() : '';
            this.optimizedPageCache = cacheProvider.getCache('optimizedPages|' + key);
            this.bundleMappingsCache = cacheProvider.getCache('bundleMappings|' + key);
        };
        
        Cache.prototype = {

            getOptimizedPage: function(pageKey) {
                return this.optimizedPageCache.get(pageKey);
            },
            
            addOptimizedPage: function(pageKey, optimizedPage) {
                this.optimizedPageCache.put(pageKey, optimizedPage);
            },
            
            getBundleMappings: function(id) {
                return this.bundleMappingsCache.get(id);
            },
            
            addBundleMappings: function(id, bundleMappings) {
                this.bundleMappingsCache.push(id, bundleMappings);
            },

            clear: function() {
                this.optimizedPageCache.clear();
                this.optimizedPageCache.clear();
            }
        };
        
        return Cache;
        
        
    });
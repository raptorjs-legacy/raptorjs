define(
    'raptor/caching/SimpleCacheProvider',
    function(require) {
        var SimpleCache = require('raptor/caching/SimpleCache');
        
        var SimpleCacheProvider = function() {
            this.cachesByName = {};
        };
        
        SimpleCacheProvider.prototype = {
            getCache: function(name) {
                if (name == null) {
                    name = "DEFAULT";
                }
                
                var cache = this.cachesByName[name];
                
                if (!cache) {
                    this.cachesByName[name] = cache = new SimpleCache();
                }
                
                return cache;
            }
        };
        
        return SimpleCacheProvider;
    });
define(
    'raptor/caching',
    function(require) {
        'use strict';
        
        var defaultProvider = null;
        
        return {
            getDefaultProvider: function() {
                if (!defaultProvider) {
                    var SimpleCacheProvider = require('raptor/caching/SimpleCacheProvider');
                    defaultProvider = new SimpleCacheProvider();
                }
                return defaultProvider;
            }
        };
    });
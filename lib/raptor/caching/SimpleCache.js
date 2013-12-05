define(
    'raptor/caching/SimpleCache',
    'raptor/caching/BaseCache',
    function(require) {
        "use strict";
        
        var SimpleCache = function() {
            SimpleCache.superclass.constructor.call(this);
            this.cacheMap = {};
        };
        
        SimpleCache.prototype = {
            doPut: function(key, value) {
                this.cacheMap[key] = value;
            },
            
            doGet: function(key) {
                return this.cacheMap[key];
            },

            clear: function() {
                this.cacheMap = {};
            },

            remove: function(key) {
                delete this.cacheMap[key];
            },

            contains: function(key) {
                return this.cacheMap.hasOwnProperty(key);
            }
        };
        
        return SimpleCache;
    });
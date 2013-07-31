define('raptor/promises', function() {
    "use strict";
    
    var resolvedPromise = null;

    return {
        isPromise: function(promise) {
            return promise != null && typeof promise.then === 'function';
        },

        resolved: function() {
            if (!resolvedPromise) {
                var deferred = this.defer();
                deferred.resolve();
                resolvedPromise = deferred.promise;
            }
            return resolvedPromise;
        },

        makePromise: function(val) {
            if (this.isPromise(val)) {
                return val;
            }
            else {
                var deferred = this.defer();
                deferred.resolve(val);    
                return deferred.promise;
            }
            
        }
    };
});
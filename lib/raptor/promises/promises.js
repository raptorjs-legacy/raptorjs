define('raptor/promises', function() {
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
        }
    };
});
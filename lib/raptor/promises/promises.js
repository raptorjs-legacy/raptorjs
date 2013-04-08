define('raptor/promises', function() {
    
    return {
        isPromise: function(promise) {
            return promise != null && typeof promise.then === 'function';
        }
    };
});
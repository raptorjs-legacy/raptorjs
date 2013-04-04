define.extend('raptor/promises', function() {
    var q = require('q');

    return {
        defer: function() {
            return q.defer();
        }
    }
});
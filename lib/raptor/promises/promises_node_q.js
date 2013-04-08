define.extend('raptor/promises', function() {
    var q = require('q');

    return {
        defer: function() {
            return q.defer();
        },

        all: function(array) {
            return q.all(array || []);
        }
    }
});
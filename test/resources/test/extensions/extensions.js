define('test/extensions', function(require) {
    var Test = require('test.extensions.Test');
    
    return {
        env: function() {
            return 'core';
        },
        
        getMessage: function() {
            return (new Test()).getMessage();
        }
    };
});
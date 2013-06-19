define('test/extension-patterns', function(require) {
    var Test = require('test/extension-patterns/Test');
    
    return {
        env: function() {
            return 'core';
        },
        
        getMessage: function() {
            return (new Test()).getMessage();
        }
    };
});
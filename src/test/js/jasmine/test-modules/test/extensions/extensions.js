raptor.defineModule('test/extensions', function(raptor, module) {
    var Test = raptor.require('test.extensions.Test');
    
    return {
        env: function() {
            return 'core';
        },
        
        getMessage: function() {
            return (new Test()).getMessage();
        }
    };
});
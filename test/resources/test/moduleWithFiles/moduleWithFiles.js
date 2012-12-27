define('test/moduleWithFiles', function(require) {
    var TestClass = require('test.moduleWithFiles.core.TestClass');
    
    return {
        createTestObject: function() {
            return new TestClass();
        }
    };
});
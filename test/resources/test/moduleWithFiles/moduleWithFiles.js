raptor.defineModule('test/moduleWithFiles', function(raptor, module) {
    var TestClass = raptor.require('test.moduleWithFiles.core.TestClass');
    
    return {
        createTestObject: function() {
            return new TestClass();
        }
    };
});
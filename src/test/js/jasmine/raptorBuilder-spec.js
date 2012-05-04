raptor.defineClass('test.raptorBuilder.Counter', function() {
    var count = 0;
    
    return {
        counter: function() {
            return count++;
        }
    };
});

describe('raptorBuilder', function() {

    it('should allow raptor environment variable to be created', function() {
        
        var runTest = function() {
            raptor = raptorBuilder.createRaptor(raptor.config);
            
            var Counter = raptor.require('test.raptorBuilder.Counter');
            
            var counter = new Counter();
            expect(counter.counter()).toEqual(0);
            expect(counter.counter()).toEqual(1);
        };
        
        runTest();
        runTest();        
    });
});
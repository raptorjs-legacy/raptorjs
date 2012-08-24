var jsdomWrapper = helpers.jsdom.jsdomWrapper;

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
    
    it("should allow for isClient() and isServer() on the server", function() {
        expect(raptor.isClient()).toStrictlyEqual(false);
        expect(raptor.isServer()).toStrictlyEqual(true);
    });
    
    it('should allow for isClient() and isServer() on the client', function() {
        createRaptor();
        jsdomWrapper({
            html: "<html><head><title>blank</title></head><body></body></html>",
            require: [
               'core',
               '/js/init-raptor.js',
            ],
            ready: function(window, raptor, done) {
                expect(raptor.isClient()).toStrictlyEqual(true);
                expect(raptor.isServer()).toStrictlyEqual(false);
                done();
            }
        });

    });
});
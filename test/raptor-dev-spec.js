require('./_helper.js');

describe('development spec', function() {
    var logger = raptor.require('logging').logger('raptor-dev-spec'),
        compileAndLoad = helpers.templating.compileAndLoad,
        compileAndRender = helpers.templating.compileAndRender;
        
    before(function() {
        createRaptor();
    });
    
    
    xit("should allow for simple conditionals", function() {
        var output = compileAndRender("/test-templates/simple-conditionals.rhtml", {name: "John", count: 51});
        expect(output).toEqual('Hello JOHN! You have 10 new messages.');        
    });

});
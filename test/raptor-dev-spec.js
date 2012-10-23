require('./_helper.js');



describe('development spec', function() {
    var logger = raptor.require('logging').logger('raptor-dev-spec'),
        compileAndLoad = helpers.templating.compileAndLoad,
        compileAndRender = helpers.templating.compileAndRender;
        
    before(function() {
        createRaptor();
    });

    xit("should allow for <c:def> functions", function() {
        var output = compileAndRender("/test-templates/def.rhtml", {});
        expect(output).toEqual('');
    });

});
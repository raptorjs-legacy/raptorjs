require('./_helper.js');



describe('development spec', function() {
    var logger = raptor.require('logging').logger('raptor-dev-spec'),
        compileAndLoad = helpers.templating.compileAndLoad,
        compileAndRender = helpers.templating.compileAndRender;
        
    before(function() {
        // createRaptor({
        //     amd: {
        //         enabled: true
        //     }
        // });
    });

    xit("should allow for amd", function() {
        var template = raptor.require('templating');
        var renderContext = template.createContext();
        var configPath = raptor.require('files').joinPaths(__dirname, '/resources/optimizer/project-a/optimizer-config.xml');
        raptor.require('optimizer').configure(configPath);
        var output = compileAndRender("/test-templates/optimizer.rhtml", {}, renderContext);
        expect(output.indexOf('<script')).toNotEqual(-1);
    });

    xit("should allow for includes", function() {
        var output = compileAndRender("/test-templates/include.rhtml", {});
        expect(output).toEqual('');
    });

});
require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var logger = require('raptor/logging').logger('raptor-dev-spec'),
    compileAndLoad = helpers.templating.compileAndLoad,
    compileAndRender = helpers.templating.compileAndRender,
    compileAndRenderAsync = helpers.templating.compileAndRenderAsync,
    runAsyncFragmentTests = helpers.templating.runAsyncFragmentTests,
    MockWriter = helpers.templating.MockWriter;

describe('dev spec', function() {

    xit("should allow for using templates to render custom tags", function() {
        var output = compileAndRender("/test-templates/template-as-tag.rhtml", {title: "My Page Title"});
        expect(output).toEqual('<div><h1>My Page Title</h1></div>');        
    });
});

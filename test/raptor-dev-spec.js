require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var logger = require('raptor/logging').logger('raptor-dev-spec'),
    compileAndLoad = helpers.templating.compileAndLoad,
    compileAndRender = helpers.templating.compileAndRender,
    compileAndRenderAsync = helpers.templating.compileAndRenderAsync,
    runAsyncFragmentTests = helpers.templating.runAsyncFragmentTests,
    MockWriter = helpers.templating.MockWriter;

xdescribe('dev spec', function() {

    it("should allow for using layouts", function() {
        var output = compileAndRender("/test-templates/layout-use.rhtml", {});
        expect(output).toEqual('<div>BODY CONTENT</div>FOOTER CONTENT<h1>HEADER CONTENT</h1><div>BODY CONTENT</div>FOOTER CONTENT<h1>VALUE HEADER</h1><div>BODY CONTENT</div>FOOTER CONTENT<h1>DEFAULT TITLE</h1><div>BODY CONTENT</div>FOOTER CONTENT');
    });
});

require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var logger = require('raptor/logging').logger('raptor-dev-spec'),
    compileAndLoad = helpers.templating.compileAndLoad,
    compileAndRender = helpers.templating.compileAndRender,
    compileAndRenderAsync = helpers.templating.compileAndRenderAsync;

function runAsyncFragmentTests(template, expected, dependencyConfigs, done) {
    var completed = 0;

    dependencyConfigs.forEach(function(dependencies) {
        compileAndRenderAsync(
            template,
            {},
            dependencies)
            .then(
                function(output) {
                    expect(output).toEqual(expected);
                    if (++completed === dependencyConfigs.length) {
                        done();    
                    }
                    
                },
                function(err) {
                    done(err);
                });
    });
}
describe('dev spec', function() {



    it("should allow for using templates to render custom tags", function(done) {
        runAsyncFragmentTests(
            "/test-templates/async-fragment-ordering.rhtml",
            '1 2 3 4 5 6 7 8 9',
            [
                {
                    'D1': {delay: 100},
                    'D2': {delay: 300},
                    'D3': {delay: 200},
                    'D4': {delay: 800}
                },
                {
                    'D1': {delay: 100},
                    'D2': {delay: 200},
                    'D3': {delay: 300},
                    'D4': {delay: 150}
                },
                {
                    'D1': {delay: 800},
                    'D2': {delay: 200},
                    'D3': {delay: 300},
                    'D4': {delay: 100}
                },
                {
                    'D1': {delay: 800},
                    'D2': {delay: 300},
                    'D3': {delay: 200},
                    'D4': {delay: 100}
                }
            ],
            done);
    });

    it("should allow for using templates to render custom tags", function(done) {
        runAsyncFragmentTests(
            "/test-templates/async-fragment-ordering2.rhtml",
            '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17',
            [
                {
                    'D1': {delay: 100},
                    'D2': {delay: 300},
                    'D3': {delay: 200},
                    'D4': {delay: 800},
                    'D5': {delay: 900},
                    'D6': {delay: 100},
                    'D7': {delay: 50},
                },
                {
                    'D1': {delay: 100},
                    'D2': {delay: 300},
                    'D3': {delay: 200},
                    'D4': {delay: 800},
                    'D5': {delay: 900},
                    'D6': {delay: 100},
                    'D7': {delay: 200},
                },
                {
                    'D1': {delay: 900},
                    'D2': {delay: 300},
                    'D3': {delay: 200},
                    'D4': {delay: 800},
                    'D5': {delay: 100},
                    'D6': {delay: 100},
                    'D7': {delay: 200},
                }
            ],
            done);
    });

    // it('shows asynchronous test node-style', function(done){
    //     setTimeout(function() {
    //         expect('second').toEqual('second');
    //         // If you call done() with an argument, it will fail the spec 
    //         // so you can use it as a handler for many async node calls
    //         done();
    //     }, 1);

    //     expect('first').toEqual('first');
    // });
});

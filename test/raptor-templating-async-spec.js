require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var logger = require('raptor/logging').logger('raptor-dev-spec'),
    compileAndLoad = helpers.templating.compileAndLoad,
    compileAndRender = helpers.templating.compileAndRender,
    compileAndRenderAsync = helpers.templating.compileAndRenderAsync,
    runAsyncFragmentTests = helpers.templating.runAsyncFragmentTests;

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

    it("should allow for using macros inside async fragments", function(done) {
        runAsyncFragmentTests(
            "/test-templates/async-fragment-macros.rhtml",
            '1 2 3',
            [
                {
                    'D1': {delay: 100}
                }
            ],
            done);
    });

    it("should allow for shared and context-specific data providers", function(done) {

        require('raptor/data-providers').register({
            'sharedData': function(args) {
                var deferred = require('raptor/promises').defer();

                setTimeout(function() {
                    deferred.resolve({
                        name: 'testSharedData'
                    })
                }, 100);

                return deferred.promise;
            }
        });

        runAsyncFragmentTests(
            "/test-templates/async-fragment-data-providers.rhtml",
            'testContextDatatestSharedData',
            [
                {
                    'contextData': {delay: 100, data: {name: "testContextData"}}
                }
            ],
            done);
    });

    it("should allow for data args", function(done) {

        var users = {
            "0": {
                name: "John B. Flowers",
                occupation: "Clock repairer",
                gender: "Male"
            },
            "1": {
                name: "Pamela R. Rice",
                occupation: "Cartographer",
                gender: "Female"
            },
            "2": {
                name: "Barbara C. Rigsby",
                occupation: "Enrollment specialist",
                gender: "Female"
            },
            "3": {
                name: "Anthony J. Ward",
                occupation: "Clinical laboratory technologist",
                gender: "Male"
            }
        }
        runAsyncFragmentTests(
            "/test-templates/async-fragment-args.rhtml",
            '<ul><li><ul><li><b>Name:</b> John B. Flowers</li><li><b>Gender:</b> Male</li><li><b>Occupation:</b> Clock repairer</li></ul></li><li><ul><li><b>Name:</b> Pamela R. Rice</li><li><b>Gender:</b> Female</li><li><b>Occupation:</b> Cartographer</li></ul></li><li><ul><li><b>Name:</b> Barbara C. Rigsby</li><li><b>Gender:</b> Female</li><li><b>Occupation:</b> Enrollment specialist</li></ul></li><li><ul><li><b>Name:</b> Anthony J. Ward</li><li><b>Gender:</b> Male</li><li><b>Occupation:</b> Clinical laboratory technologist</li></ul></li></ul>',
            [
                {
                    'userInfo': {
                        delay: 100, 
                        dataFunc: function(arg) {
                            return users[arg.userId];
                        }
                    }
                }
            ],
            done);
    });

    it("should allow a data provider to be a promise", function(done) {

        var deferred = require('raptor/promises').defer();
        setTimeout(function() {
            deferred.resolve('Test promise');
        }, 200);


        runAsyncFragmentTests(
            "/test-templates/async-fragment-promise.rhtml",
            'Test promise',
            [
                {
                    'promiseData': {
                        promise: deferred.promise
                    }
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

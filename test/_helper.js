require('jsdom');

var raptor = require('../lib/raptor/raptor-main_node.js');
var define = raptor.createDefine(module);

require('raptor/logging').configure({
    loggers: {
        'ROOT': { level: "WARN" },
        'raptor/optimizer': { level: "DEBUG" }
    }
})

var files = require('raptor/files');
var File = require('raptor/files/File');
var resources = require('raptor/resources');
var logger = require('raptor/logging').logger('helper');

raptor.require('raptor/packaging').enableExtension('json.raptor');

resources.addSearchPathDir(files.joinPaths(__dirname, 'resources'));

var matchers = {
    toNotStrictlyEqual: function(expected) {
        return this.actual !== expected;
    },
    
    toStrictlyEqual: function(expected) {
        return this.actual === expected;
    },
    
    toEqualArray: function(expected) {
        
        if (this.actual == expected) return true;
        if (!this.actual || !expected) return false;
        if (!Array.isArray(this.actual)) return false;
        if (!Array.isArray(expected)) return false;
        if (this.actual.length != expected.length) return false;
        

        var i=0,
            len=this.actual.length;
        
        
        for (;i<len; i++) {
            if (this.actual[i] != expected[i]) {
                return false;
            }
        }

        return true;
    }
};

raptor.extend(jasmine.Matchers.prototype, matchers);

jasmine.getEnv().beforeEach(function() {
    this.addMatchers(matchers);
});

global.helpers = {};

//Templating helper functions
var compileAndLoad = function(templatePath, invalid) {
        try
        {
            var templateCompiler = require("raptor/templating/compiler").createCompiler({logErrors: invalid !== true, minify: false, templateName: templatePath});
            
            var resource = require('raptor/resources').findResource(templatePath);
            if (!resource.exists()) {
                throw new Error('Template not found at path "' + templatePath + '"');
            }
            
            var src = resource.readAsString();
            var compiledSrc = templateCompiler.compile(src, resource);
            console.log('\n==================================\nCompiled source (' + templatePath + '):\n----------------------------------\n', compiledSrc, "\n----------------------------------\n");
            
            try
            {
                eval(compiledSrc);
            }
            catch(e) {
                console.error('Unable to compile and load template at path "' + templatePath + '". Exception: ' + e + '\nStack: ' + e.stack + "\n\nSource: " + compiledSrc);
                throw new Error('Unable to compile and load template at path "' + templatePath + '". Exception: ' + e);
            }
            
            return compiledSrc;
        }
        catch(e) {
            if (!invalid) {
                logger.error(e);
            }
            
            throw e;
        }
    },
    compileAndRender = function(templatePath, data, context, invalid) {
        try
        {
            var compiledSrc = compileAndLoad(templatePath, invalid);
            
            var output = require("raptor/templating").renderToString(templatePath, data, context);
            console.log('==================================\nOutput (' + templatePath + '):\n----------------------------------\n', output, "\n----------------------------------\n");
            
            return output;
        }
        catch(e) {
            if (!invalid) {
                logger.error(e);
            }
            
            throw e;
        }
    },
    compileAndRenderAsync = function(templatePath, data, dependencies) {
        var dataProviders = {};
        raptor.forEachEntry(dependencies, function(dependency, config) {
            if (config.promise) {
                dataProviders[dependency] = config.promise;
            }
            else {
                dataProviders[dependency] = function(args) {
                    var deferred = require('raptor/promises').defer();

                    setTimeout(function() {
                        var data;

                        if (config.dataFunc) {
                            data = config.dataFunc(args);
                        }
                        else {
                            data = config.data || {};
                        }

                        deferred.resolve(data);
                    }, config.delay);

                    return deferred.promise;
                }
            }
                
        });

        try
        {
            var compiledSrc = compileAndLoad(templatePath);
            var context = require('raptor/templating').createContext();
            context.dataProvider(dataProviders);

            var promise = require("raptor/templating").renderAsync(templatePath, data, context);
            promise.then(function(context) {
                var output = context.getOutput();
                console.log('==================================\nOutput (' + templatePath + '):\n----------------------------------\n', output, "\n----------------------------------\n");
            })
            return promise;
        }
        catch(e) {
            logger.error(e);
            throw e;
        }
    },
    runAsyncFragmentTests = function(template, expected, dependencyConfigs, done) {
        var completed = 0;

        dependencyConfigs.forEach(function(dependencies) {
            compileAndRenderAsync(
                template,
                {},
                dependencies)
                .then(
                    function(context) {
                        var output = context.getOutput();
                        expect(output).toEqual(expected);
                        if (++completed === dependencyConfigs.length) {
                            done();    
                        }
                        
                    },
                    function(err) {
                        done(err);
                    });
        });
    };

var MockWriter = define.Class(
    {
        superclass: 'raptor/optimizer/OptimizerFileWriter'
    },
    function(require, module, exports) {

        var listeners = require('raptor/listeners');

        function MockWriter(pageOptimizer) {
            MockWriter.superclass.constructor.apply(this, arguments);
            this.outputBundleFiles = {};
            this.outputBundleFilenames = {};
            listeners.makeObservable(this, MockWriter.prototype, ['fileWritten']);
        };

        MockWriter.prototype = {
            writeBundleFile: function(outputFile, code) {
                this.outputBundleFiles[outputFile.getAbsolutePath()] = code;
                this.outputBundleFilenames[outputFile.getName()] = code;
                this.publish('fileWritten', {
                    file: outputFile,
                    filename: outputFile.getName(),
                    code: code
                })
            },

            getOutputBundlePaths: function() {
                var paths = Object.keys(this.outputBundleFiles);
                paths.sort();
                return paths;
            },

            getOutputBundleFilenames: function() {
                var filenames = Object.keys(this.outputBundleFilenames);
                filenames.sort();
                return filenames;
            },

            getCodeForFilename: function(filename) {
                return this.outputBundleFilenames[filename];
            }
        };

        return MockWriter;
    });

helpers.templating = {
    compileAndLoad: compileAndLoad,
    compileAndRender: compileAndRender,
    compileAndRenderAsync: compileAndRenderAsync,
    runAsyncFragmentTests: runAsyncFragmentTests,
    MockWriter: MockWriter
};

//JSDOM helper functions
require('jsdom').defaultDocumentFeatures = {
    FetchExternalResources   : ['script'],
    ProcessExternalResources : ['script'],
    MutationEvents           : '2.0',
    QuerySelector            : false
};

var jsdomOptimizerConfig = require('raptor/optimizer').loadConfigXml(new File(__dirname, 'jsdom-optimizer-config.xml')),
    jsdomOptimizer = require('raptor/optimizer').createPageOptimizer(jsdomOptimizerConfig);

function jsdomScripts(dependencies, enabledExtensions) {
    if (!enabledExtensions) {
        enabledExtensions = ['browser', 'jquery', 'raptor/logging/console'];
    }

    var deferred = require('raptor/promises').defer();

    jsdomOptimizer.optimizePage({
            dependencies: dependencies,
            name: 'jsdom',
            enabledExtensions: enabledExtensions
        })
        .then(
            function(optimizedPage) {
                var scripts = optimizedPage.getJavaScriptFiles().map(function(path) {
                    return files.fileUrl(path);
                });
                // console.log('jsdom scripts: \n', scripts);
                deferred.resolve(scripts);
            },
            function(e) {
                deferred.reject(e);
            })

    return deferred.promise;
};

var jsdomLogger = raptor.require('raptor/logging').logger('jsdomWrapper')

helpers.jsdom = {
    jsdomScripts : jsdomScripts,
    jsdomWrapper: function(config) {
        
        var html = config.html,
            error = config.error,
            success = config.success,
            DOMParser = require('xmldom').DOMParser,
            exception;

        if (!error && !success) {
            throw new Error('"error" and "success" callbacks required');
        }

        function loadJsdom(scripts) {
            try {
                require('jsdom').env({
                    html: html,
                    scripts: scripts,
                    features: {
                        FetchExternalResources   : ['script'],
                        ProcessExternalResources : ['script'],
                        MutationEvents           : '2.0',
                        QuerySelector            : false
                    },
                    done: function(errors, window) {
                        if (errors && errors.length) {
                            done(errors);
                            return;
                        }

                        window.console = console;
                        window.DOMParser = DOMParser;
                        
                        try {
                            success(window);
                        }
                        catch(e) {
                            error(e);
                        }
                    }
                });
            }
            catch(e) {
                error(e);
            }
        }

        jsdomScripts(config.require).then(loadJsdom, error);
    }
};



//Add support for "before" and "after" methods
getEnv().addReporter({
    reportSpecStarting: function(spec) {
        var suite = spec.suite;
        if (suite.__started !== true) {
            if (suite.beforeFunc) {
                suite.beforeFunc.call(suite, suite);
            }
            suite.__started = true;
        }
        
    },
    
    reportSpecResults: function(spec) { 
    },
    
    reportSuiteResults: function(suite) { 
        if (suite.afterFunc) {
            suite.afterFunc.call(suite, suite);
        }
    },
    
    reportRunnerResults: function(runner) {        
        if (typeof _$jscoverage !== 'undefined') {
            codeCoverageReporter.save(_$jscoverage);
        }
    }
});

// jasmine.Env.prototype.before = function(beforeFunc) {
//     this.currentSuite.beforeFunc = beforeFunc;
// };

// jasmine.Env.prototype.after = function(afterFunc) {
//     this.currentSuite.afterFunc = afterFunc; 
// };

// before = function() {
//     jasmine.Env.prototype.before.apply(getEnv(), arguments);
// };

// after = function() {
//     jasmine.Env.prototype.after.apply(getEnv(), arguments);
// };

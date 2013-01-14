require('jsdom');

var raptor = require('raptor'),
    files = require('raptor/files'),
    File = require('raptor/files/File'),
    resources = require('raptor/resources'),
    logger = require('raptor/logging').logger('helper');

raptor.require('raptor/packaging').enableExtension('json.raptor');

resources.addSearchPathDir(files.joinPaths(__dirname, 'resources'));

beforeEach(function() {
    this.addMatchers({
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
    });
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
    };
helpers.templating = {
    compileAndLoad: compileAndLoad,
    compileAndRender: compileAndRender
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

jsdomScripts = function(dependencies, enabledExtensions) {
    if (!enabledExtensions) {
        enabledExtensions = ['browser', 'jquery', 'raptor/logging/console'];
    }

    var optimizedPage = jsdomOptimizer.optimizePage({
        dependencies: dependencies,
        name: 'jsdom',
        enabledExtensions: enabledExtensions
    })

    var scripts = optimizedPage.getJavaScriptFiles().map(function(path) {
        return files.fileUrl(path);
    });
    
    console.log('jsdom scripts: \n', scripts);
    return scripts;
};

var jsdomLogger = raptor.require('raptor/logging').logger('jsdomWrapper')

helpers.jsdom = {
    jsdomScripts : jsdomScripts,
    jsdomWrapper: function(config) {
        
        var html = config.html,
            scripts = jsdomScripts(config.require),
            done = false,
            DOMParser = require('xmldom').DOMParser,
            exception;
        
        runs(function() {
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
                            console.error('jsdom errors: ', errors);
                            done = true;
                            return;
                        }
                        window.console = console;
                        window.DOMParser = DOMParser;
                        
                        try {
                            config.ready(window, function(errorMessage) {
                                done = true;
                                if (errorMessage) {
                                    exception = errorMessage;
                                }
                            });
                        }
                        catch(e) {
                            exception = e;
                            //throw raptor.createError(new Error("Error in ready function. Exception: " + e), e);
                        }
                    }
                });
            }
            catch(e) {
                done = true;
                exception = e;
            }
        });
        
        waitsFor(function() {
            if (exception) {
                jsdomLogger.error("Error in jsdom test: " + exception, typeof exception !== 'string' ? exception : null);
                throw exception;
            }
            return done === true;
        }, "jsdom callback", config.timeout || 1000);
                
        return {
            setDone: function() {
                done = true;
            }
        };
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

jasmine.Env.prototype.before = function(beforeFunc) {
    this.currentSuite.beforeFunc = beforeFunc;
};

jasmine.Env.prototype.after = function(afterFunc) {
    this.currentSuite.afterFunc = afterFunc;
};

before = function() {
    jasmine.Env.prototype.before.apply(getEnv(), arguments);
};

after = function() {
    jasmine.Env.prototype.after.apply(getEnv(), arguments);
};

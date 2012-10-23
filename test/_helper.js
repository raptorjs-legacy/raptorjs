require('./init-raptor.js');

var logger = raptor.require('logging').logger('_helper');
var codeCoverageReporter = require('./code-coverage-reporter.js');

beforeEach(function() {
    this.addMatchers({
        toNotStrictlyEqual: function(expected) {
            return this.actual !== expected;
        },
        
        toStrictlyEqual: function(expected) {
            return this.actual === expected;
        },
        
        toEqualArray: function(expected) {
            if (this.actual == expected) {
                return true;
            }
            
            if (!this.actual || !expected) return false;
            
            if (this.actual.constructor !== Array) return false;
            if (expected.constructor !== Array) return false;
            
            
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

//jasmine.Matchers.prototype.toNotStrictlyEqual = function(expected) {
//    return this.actual !== expected;
//};
//
//jasmine.Matchers.prototype.toStrictlyEqual = function(expected) {
//    console.error("toStrictlyEqual args: ", arguments, ' THIS: ', this.actual, new Error().stack);
//    return this.actual === expected;
//};
//
//jasmine.Matchers.prototype.toEqualArray = function(expected) {
//    if (this.actual == expected) {
//        return true;
//    }
//    
//    if (!this.actual || !expected) return false;
//    
//    if (this.actual.constructor !== Array) return false;
//    if (expected.constructor !== Array) return false;
//    
//    
//    if (this.actual.length != expected.length) return false;
//    var i=0,
//        len=this.actual.length;
//    
//    
//    
//    for (;i<len; i++) {
//        if (this.actual[i] != expected[i]) {
//            return false;
//        }
//    }
//    return true;
//};

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
        createRaptor();
        
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

var isCommonJS = typeof window == "undefined";

before = function() {
    jasmine.Env.prototype.before.apply(getEnv(), arguments);
};

after = function() {
    jasmine.Env.prototype.after.apply(getEnv(), arguments);
};

if (isCommonJS) {
    exports.before = before;
    exports.after = after;
}
var compileAndLoad = function(templatePath, invalid) {
        try
        {
            var templateCompiler = raptor.require("templating.compiler").createCompiler({logErrors: invalid !== true, minify: false, templateName: templatePath});
            
            var resource = raptor.require('resources').findResource(templatePath);
            if (!resource.exists()) {
                throw new Error('Template not found at path "' + path + '"');
            }
            
            var src = resource.readAsString();
            var compiledSrc = templateCompiler.compile(src, resource);
            console.log('\n==================================\nCompiled source (' + templatePath + '):\n----------------------------------\n', compiledSrc, "\n----------------------------------\n");
            
            raptor.require("templating");
            
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
            
            var output = raptor.require("templating").renderToString(templatePath, data, context);
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
    
getTestHtmlPath = function(relPath) {
    var nodePath = require('path');
    return nodePath.join(__dirname, "resources/html", relPath);
};

getTestHtmlUrl = function(relPath) {
    var nodePath = require('path');
    return 'file://' + nodePath.join(__dirname, "resources/html", relPath);
};

getTestJavaScriptPath = function(relPath) {
    
    var nodePath = require('path');

    return nodePath.join(__dirname, "resources/js", relPath);
};

require('jsdom').defaultDocumentFeatures = {
        FetchExternalResources   : ['script'],
        ProcessExternalResources : ['script'],
        MutationEvents           : '2.0',
        QuerySelector            : false
  };

jsdomScripts = function(dependencies) {
    
    var scripts = [];
    var arrays = raptor.arrays;
    var included = {},
        extensions = {
            'browser': true, 
            'jquery': true, 
            'logging.console': true
        };
    
    var handleFile = function(path) {
        if (included[path] !== true) {
            included[path] = true;
            scripts.push("file://" + path);
        }
    };
    
    var handleResource = function(path) {
        if (included[path] !== true) {
            included[path] = true;
            
            var resource = raptor.resources.findResource(path);
            if (!resource.exists()) {
                throw new Error('Resource not found with path "' + path + '"');
            }
            handleFile(resource.getSystemPath());
        }
    };
    
    var handleModule = function(name) {
        if (included[name] === true) {
            return;
        }
        
        included[name] = true;
        
        
        
        var manifest = raptor.oop.getModuleManifest(name);
        if (!manifest) {
            throw raptor.createError(new Error('Module not found for name "' + name + '"'));
        }
        manifest.forEachDependency({
            callback: function(type, include) {
                if (type === 'js') {
                    var resource = manifest.resolveResource(include.path);
                    handleFile(resource.getSystemPath());
                }
                else if (type === 'module') {
                    handleModule(include.name);
                }
            },
            enabledExtensions: extensions,
            thisObj: this
        });
    };

    var processDependencies = function(dependencies) {
        arrays.forEach(dependencies, function(d) {
            if (typeof d === 'string') {
                if (raptor.strings.endsWith(d, '.js')) {
                    handleResource(d);
                }
                else {
                    handleModule(d);
                }
            }
            else if (d.module) {
                handleModule(d.module);
            }
            else if (d.resource)
            {
                handleResoure(d.resource);
            }
            else if (d.file)
            {
                handleFile(d.file);
            }
        });
    };
    processDependencies(dependencies);
//
//    
//    console.log('BROWSER SCRIPTS:');
//    console.log(scripts);
    return scripts;
};


helpers = {
   templating: {
       compileAndLoad: compileAndLoad,
       compileAndRender: compileAndRender
   },
   
   jsdom: {
       jsdomScripts : jsdomScripts,
       jsdomWrapper: function(config) {
           
           var html = config.html,
               scripts = jsdomScripts(config.require),
               done = false,
               DOMParser = require('xmldom').DOMParser;
           
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
                               config.ready(window, window.raptor, function() {
                                   done = true;
                               });
                           }
                           catch(e) {
                               console.error("Error in ready function: " + e);
                               done = true;
                           }
                       }
                   });
               }
               catch(e) {
                   done = true;
                   exception = e;
                   console.error('Error: ' + e, e.stack);
               }
           });
           
           waitsFor(function() {
               return done === true;
           }, "jsdom callback", config.timeout || 1000);
               
           return {
               setDone: function() {
                   done = true;
               }
           };
       }
   }
};
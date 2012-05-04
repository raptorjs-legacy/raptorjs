require('./init-raptor.js');
var codeCoverageReporter = require('./code-coverage-reporter.js');

jasmine.Matchers.prototype.toNotStrictlyEqual = function(expected) {
    return this.actual !== expected;
};

jasmine.Matchers.prototype.toStrictlyEqual = function(expected) {
    return this.actual === expected;
};

jasmine.Matchers.prototype.toEqualArray = function(expected) {
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
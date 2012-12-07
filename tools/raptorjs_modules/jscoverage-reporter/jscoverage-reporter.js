define("jscoverage-reporter", function() {
    var CoverageReporter = require('jscoverage-reporter.CoverageReporter');
    return {
        buildReport: function(jscoverage) {
            return new CoverageReporter(jscoverage);
        }
    };
});
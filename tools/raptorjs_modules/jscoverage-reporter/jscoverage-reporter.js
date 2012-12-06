define("jscoverage-reporter", function() {
    var CoverageReporter = raptor.require('jscoverage-reporter.CoverageReporter');
    return {
        buildReport: function(jscoverage) {
            return new CoverageReporter(jscoverage);
        }
    };
});
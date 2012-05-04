raptor.defineClass('jscoverage-reporter.CoverageReporter', function() {
    var DefaultHtmlPublisher = raptor.require('jscoverage-reporter.DefaultHtmlPublisher'); 
    
    return {
        init: function(jscoverage, options) {
            this.jscoverage = jscoverage;
            this.options = options;
            this._populate(jscoverage);
            
        },
        
        _populate: function(jscoverage) {
            raptor.forEachEntry(jscoverage, function(filename, lines) {
               var source = lines.source;
               
            });
        },
            
       publishHTML: function(dir, publisher) {
           if (!publisher) {
               publisher = new DefaultHtmlPublisher();
           }
           
           publisher.publish(dir);
       }   
    };
});
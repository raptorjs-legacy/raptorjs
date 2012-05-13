raptor.defineClass('jscoverage-reporter.DefaultHtmlPublisher', function() {
    var dust = raptor.require('templating.dust'),
        resources = raptor.require('resources');
    
    var compileTemplate = function(name) {
        var resourcePath = '/jscoverage-reporter/default-skin/' + name + '.dust.html';
        var resource = resources.findResourceSync(resourcePath);
        if (!resource.exists()) {
            throw new Error("Resource not found: " + resourcePath);
        }
        source = resource.readFully();
        
        dust.compile(name, source);
    };
    
    return {
        publish: function(dir) {
            console.log('Publishing JS coverage report to "' + dir + '"...');
            
            //Register the templates
            compileTemplate('overview');
            
            dust.render(
                'overview', 
                {
                    name: 'Test'
                },
                {
                    success: function(out) {
                        console.log(out);
                    }
                });
            
        }
    };
});
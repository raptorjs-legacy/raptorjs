exports.controller = function() {
    var resources = raptor.require('resources');
    
    var index = eval('(' + resources.findResource('/samples/index.json').readFully() + ')');
    
    var samples = [];
    
    var readResource = function(path, defaultValue) {        
        var resource = resources.findResource("/samples/" + path);
        return resource && resource.exists() ? resource.readFully() : defaultValue;
    };
    
    var defaultOptionsJson = readResource('default-options.json');
    
    raptor.forEach(index, function(sample) {
        var templates = [];
        
        raptor.forEach(sample.templates, function(template) {
            templates.push({
                source: readResource(template),
                path: template
            });
        }, this);
        
        samples.push({
            label: sample.label,
            template: readResource(sample.path + ".rhtml", ''),
            data: readResource(sample.path + "-data.json", '{}'),
            options: readResource(sample.path + "-options.json") || defaultOptionsJson,
            templates: templates
         });
    });
    
    
    
    return {
        samples: samples
    };
};
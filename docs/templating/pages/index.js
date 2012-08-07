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
        samples.push({
            label: sample.label,
            template: readResource(sample.path + ".rhtml", ''),
            data: readResource(sample.path + "-data.json", '{}'),
            options: readResource(sample.path + "-options.json") || defaultOptionsJson
         });
    });
    
    
    
    return {
        samples: samples
    };
};
getTestHtmlPath = function(relPath) {
    var nodePath = require('path');
    return nodePath.join(__dirname, "html", relPath);
};

getTestHtmlUrl = function(relPath) {
    var nodePath = require('path');
    return 'file://' + nodePath.join(__dirname, "html", relPath);
};

getTestJavaScriptPath = function(relPath) {
    
    var nodePath = require('path');

    return nodePath.join(__dirname, "js", relPath);
};

getRequiredBrowserScripts = function(dependencies) {
    
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
    
    var handleModule = function(name) {
        if (included[name] === true) {
            return;
        }
        
        included[name] = true;
        
        var manifest = raptor.oop.getModuleManifest(name);
        manifest.forEachInclude({
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
            if (d.module) {
                handleModule(d.module);
            }
            else if (d.lib === 'jquery')
            {
                handleFile(getTestJavaScriptPath('jquery-1.7.js'));
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

//require('jsdom').defaultDocumentFeatures = {
//    FetchExternalResources   : ['script'],
//    ProcessExternalResources : false,
//    MutationEvents           : false,
//    QuerySelector            : false
//  };
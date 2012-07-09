
var nodePath = require('path');

var testsDir = __dirname;

var jsDir = null,
    toolsDir = null;

if (process.env.RAPTORJS_DIR) {
    jsDir = process.env.RAPTORJS_DIR;
    toolsDir = process.env.RAPTORJS_TOOLS_DIR;
}
else {
    var rootDir = nodePath.join(testsDir, "/../../../.."); //Assume we are in the /RaptorPres/RaptorJS/src/test/js directory
    jsDir = nodePath.join(rootDir,  "/src/main/javascript");
    toolsDir = nodePath.join(rootDir,  "/tools");
}

var toolsModulesDir =  nodePath.join(toolsDir,  "/raptorjs_modules");
var resourcesDir = nodePath.join(testsDir,     "/resources");

createRaptor = function(override) {
    var config = {
        amd: {
    	    enabled: true
        },
        logging: {
            loggers: GLOBAL.raptorLoggingConfig || {
                'ROOT': {level: 'WARN'},
                'packager.bundler': {level: 'DEBUG'},
                'oop-server': {level: 'WARN'},
                'resources': {level: 'WARN'}
            }
        },
        packager: {
            enabledExtensions: ['json.raptor', 'logging.console']
        },
        resources: {
            searchPath: [
                {
                    type: "dir",
                    path: resourcesDir
                },
                {
                    type: "dir",
                    path: toolsModulesDir
                }
            ]
        }
    };
    
    if (override) {
        for (var key in override) {
            if (override.hasOwnProperty(key)) {
                config[key] = override[key];
            }
        }
    }
    
    require("raptorjs").createRaptor(config);
};

createRaptor();

getTestsDir = function(relPath) {
    return nodePath.join(testsDir, relPath);
};

getTestsFile = function(relPath) {
    return nodePath.join(testsDir, relPath);
};

createBrowserRaptor = function() {
    createRaptor({
        'packager': {
            'enabledExtensions': ['browser', 'logging.console']
        },
        'resources': {
            searchPath: []
        }
    });
};


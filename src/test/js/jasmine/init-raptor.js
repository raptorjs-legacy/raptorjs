
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
    jsDir = nodePath.join(rootDir,  "/src/main/resources/META-INF/resources/js");
    toolsDir = nodePath.join(rootDir,  "/tools/raptor-modules");
}

var raptorModulesDir = nodePath.join(jsDir,     "/raptor/modules");
var toolsModulesDir =  nodePath.join(toolsDir,  "/raptor-modules");

//Initialize the Raptor NodeJS module
require("raptor").setCoreModulesDir(raptorModulesDir);

require("raptor").createRaptor({
    logging: {
        loggers: GLOBAL.raptorLoggingConfig || {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            'resources': {level: 'WARN'}
        }
    },
    packaging: {
        enabledExtensions: ['server', 'node', 'logging.console']
    },
    resources: {
        searchPath: [
            {
                type: "dir",
                path: __dirname
            },
            {
                type: "dir",
                path: raptorModulesDir
            },
            {
                type: "dir",
                path: toolsModulesDir
            }
        ]
    }
});

getTestsDir = function(relPath) {
    return nodePath.join(testsDir, relPath);
};

getTestsFile = function(relPath) {
    return nodePath.join(testsDir, relPath);
};



createRaptor = function(override) {
    var config = {

            'packaging': {
                'enabledExtensions': ['server', 'node', 'json.raptor', 'logging.console']
            },
            
            'logging': {
                loggers: {
                    'ROOT': {level: 'WARN'},
                    'oop-server': {level: 'WARN'},
                    'resources': {level: 'WARN'}
                }
            },
            'resources': {
                searchPath: [
                    {
                        type: "dir",
                        path: raptorModulesDir
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
    raptor = raptorBuilder.createRaptor(config);
};

createBrowserRaptor = function() {
    raptor = raptorBuilder.createRaptor({
        'packaging': {
            'enabledExtensions': ['browser', 'logging.console']
        },
        
        'logging': {
            loggers: {
                'ROOT': {level: 'WARN'},
                'oop-server': {level: 'WARN'},
                'resources': {level: 'WARN'}
            }
        },
        'resources': {
            searchPath: [
                {
                    type: "dir",
                    path: raptorModulesDir
                }
            ]
        }
        
    });
};


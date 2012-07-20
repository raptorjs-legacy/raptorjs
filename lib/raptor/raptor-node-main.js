var loaded = false;


var nodePath = require('path'),
    nodeFS = require('fs'),
    hotReloader = require('hot-reloader');

function existsSync() {
    var obj = nodeFS.existsSync ? nodeFS : nodePath;
    return obj.existsSync.apply(obj, arguments);
}

var requireModuleFile = function(path) {
    require(nodePath.join(_coreModulesDir, path));
};

var moduleDirs = [nodePath.join(__dirname, '../../src/main/resources/META-INF/resources/raptor_modules'), nodePath.join(__dirname, 'raptor_modules')];

var _coreModulesDir;

for (var i=0; i<moduleDirs.length; i++) {
    if (existsSync(moduleDirs[i])) {
        _coreModulesDir = moduleDirs[i];
        break;
    }
}

if (!_coreModulesDir) {
    throw new Error("Core RaptorJS modules not found at either of the following locations: " + JSON.stringify(moduleDirs));
}

var addCoreModulesSearchPatryEntry = function(config) {

    var coreSearchPath = {
            type: "dir",
            path: _coreModulesDir
        };
    
    var resourcesConfig = config.resources;
    if (!resourcesConfig) {
        resourcesConfig = config.resources = {};
    }
    var searchPath = resourcesConfig.searchPath;
    
    if (!searchPath) {
        searchPath = resourcesConfig.searchPath = [];
    }
    
    searchPath.splice(0, 0, coreSearchPath);
};

var enableNodeExtensions = function(config) {
    
    
    var packagerConfig = config.packager;
    if (!packagerConfig) {
        packagerConfig = config.packager = {};
    }
    var enabledExtensions = packagerConfig.enabledExtensions;
     
    if (!enabledExtensions) {
        enabledExtensions = packagerConfig.enabledExtensions = [];
    }
    
    enabledExtensions.push("node");
    enabledExtensions.push("server");
};

exports.createRaptor = exports.create = function(config) {
    if (!config) {
        config = {};
    }
    
    if (!loaded) {
        require(nodePath.join(_coreModulesDir, "bootstrap/bootstrap_server.js"));
        raptorBootstrap.env = "node";
        raptorBootstrap.require = function(path) {
            require(nodePath.join(_coreModulesDir, path));
        };
        
        raptorBootstrap.load();
        loaded = true;
    }

    addCoreModulesSearchPatryEntry(config);
    enableNodeExtensions(config);
    raptor = raptorBuilder.createRaptor(config); 
    return raptor;
};

exports.expressRaptor = function() {
    return require('./express-raptor');
};

exports.watchNodeModule = hotReloader.watch;
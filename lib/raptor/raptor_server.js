var NODE = 'node',
    RHINO = 'rhino';

exports.load = function(raptorEnv) {
    "use strict";
    
    var raptor = require('./raptor.js');

    var oldExists = raptor.exists,
        oldRequire = raptor.require,
        nonExistent = {},
        resolvers = [],
        DEFINE_PROPS = 1;

    var _resolve = function(id) {
        for (var i=0, len=resolvers.length; i<len; i++) {
            var resolver = resolvers[i];
            resolver(id);
            if (oldExists(id)) {
                break;
            }
        }
    };
    
    raptor.resolvers = resolvers;
    
    raptor.require = function(id) {
        if (raptor.exists(id)) {
            return oldRequire(id);
        }
        else {
            throw new Error('Module not found with ID "' + id + '"');
            
        }
    };

    raptor.exists = function(id) {
        if (nonExistent[id]) {
            return false;
        }
        
        var exists = oldExists(id);
        
        if (!exists) {
            _resolve(id);
            exists = oldExists(id);
        }
        
        if (!exists) {
            nonExistent[id] = true;
        }

        return exists;
    };

    var createReq = function(module) {
        return function(id, baseName) {
            var raptorId = raptor.normalize(id, baseName);
            if (raptor.exists(raptorId)) {
                return raptor.require(raptorId);
            }
            else {
                return module.require(id);
            }
        };
        
    };

    raptor.createDefine = function(module) {
        var require = createReq(module);
        
        var define = function() {
            return raptor._define(arguments, createReq(module));
        };
            
        define.require = require;
        return raptor.extend(define, raptor.props[DEFINE_PROPS]);
    };

    function _require(path, env) {
        if (env && env !== raptorEnv) {
            return;
        }
        var m = require(path);
        if (m.load) {
            m.load(raptor);
        }
    }

    function _raptorRequire(moduleId, env) {
        if (env && env !== raptorEnv) {
            return;
        }

        raptor.require(moduleId);
    }

    _require('./ecma/es6/es6.js');
    
    _require('./raptor_node.js', NODE);
    _require('./raptor_rhino.js', RHINO);

    _require('./objects/objects.js');
    _require('./arrays/arrays.js');
    _require('./strings/strings.js');
    _require('./strings/StringBuilder.js');
    _require('./regexp/regexp.js');
    _require('./json/parse/parse.js');
    _require('./json/stringify/stringify.js');

    _require('./debug/debug.js');
    _require('./listeners/listeners.js');
    _require('./config/config.js');
    
    _require('./ecma/JSON/JSON.js', RHINO); //Patch older versions of Rhino that don't include the JSON object
    _require('./java/java_rhino.js', RHINO);
    
    _require('./console/console_node.js', NODE);
    _require('./console/console_rhino.js', RHINO);
    
    _require('./stacktraces/stacktraces_node.js', NODE);
    _require('./stacktraces/stacktraces_rhino.js', RHINO);

    _require('./logging/logging_stubs.js');
    _require('./logging/Logger.js');
    _require('./logging/ConsoleAppender.js');
    _require('./logging/logging.js');

    _require('./files/FileMixins.js');
    _require('./files/File_node.js', NODE);
    _require('./files/File_rhino.js', RHINO);
    _require('./files/files.js');
    _require('./files/files_node.js', NODE);
    _require('./files/files_rhino.js', RHINO);
    

    // JavaScript runtime module
    _require('./runtime/runtime.js');
    _require('./runtime/runtime_node.js', NODE);
    _require('./runtime/runtime_rhino.js', RHINO);
    
   //Packaging module
    _require('./packaging/ExtensionCollection.js');
    _require('./packaging/PackageManifest.js');
    _require('./packaging/PackageLoader.js');
    _require('./packaging/packaging_server.js');
    _require('./packaging/packaging_rhino.js', RHINO);
    
     //Resources module
    _require('./resources/DirSearchPathEntry.js');
    _require('./resources/FileResource.js');
    _require('./resources/MissingResource.js');
    _require('./resources/Resource.js');
    _require('./resources/SearchPathEntry.js');
    _require('./resources/SearchPath.js');
    _require('./resources/resources.js');
    _require('./resources/resources_server.js');
    _require('./resources/RhinoResourceAdapter.js', RHINO);
    _require('./resources/RhinoSearchPathEntryAdapter.js', RHINO);
    _require('./resources/RhinoResMgrSearchPathEntryAdapter.js', RHINO);

    /*
    Preload all of the modules.
    NOTE: This must be done before custom resolvers are added since the
          custom resolvers depend on many of the bootstrap modules
     */
    _raptorRequire('raptor/objects');
    _raptorRequire('raptor/arrays');
    _raptorRequire('raptor/strings');
    _raptorRequire('raptor/regexp');
    _raptorRequire('raptor/json/parse');
    _raptorRequire('raptor/json/stringify');
    _raptorRequire('raptor/debug');
    _raptorRequire('raptor/listeners');
    _raptorRequire('raptor/config');
    _raptorRequire('raptor/java', RHINO);
    _raptorRequire('raptor/stacktraces');
    _raptorRequire('raptor/logging');
    _raptorRequire('raptor/files');
    _raptorRequire('raptor/runtime');
    _raptorRequire('raptor/packaging');
    _raptorRequire('raptor/resources');


    var packaging = raptor.require('raptor/packaging');
    packaging.enableExtension(raptorEnv);
    packaging.enableExtension('server');
    
    var resources = raptor.require('raptor/resources');

    /*
     * Add a module resource resolver. That looks for a module
     * with a corresponding JavaScript resource:
     *
     */
    resolvers.push(function(id) {
        var resourcePath = '/' + id.replace(/\./g, '/') + '.js';
        var resource = resources.findResource(resourcePath);
        if (resource && resource.exists()) {
            raptor.require('raptor/runtime').evaluateResource(resource);
        }
    });

    /*
     * Add a module package resolver
     */
    resolvers.push(function(id) {
        var manifest = packaging.getModuleManifest(id);
        
        if (manifest) {
            packaging.load(manifest);
        }
    });
    
    return raptor;
};


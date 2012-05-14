raptorBootstrap = {
    env: null,
    
    _require: function(path, env) {
        if (env && env !== this.env) {
            return;
        }
        this.require(path);
    },
    
    require: function(path) {
        throw new Error("require not implemented");
    },
    
    load: function() {
        var NODE = 'node',
            RHINO = 'rhino';
        
        this._require('raptorBuilder/raptorBuilder.js');
        this._require('objects/objects.js');
        this._require('arrays/arrays.js');
        this._require('strings/strings.js');
        this._require('strings/StringBuilder.js');
        this._require('regexp/regexp.js');

        this._require('debug/debug.js');
        this._require('listeners/listeners.js');
        this._require('config/config.js');

        this._require('ecma/json/JSON.js', RHINO); //Patch older versions of Rhino that don't include the JSON object
        
        this._require('env/env_node.js', NODE);
        this._require('env/env_rhino.js', RHINO);
        
        this._require('java/java_rhino.js', RHINO);

        this._require('console/console_node.js', NODE);
        this._require('console/console_rhino.js', RHINO);

        //Stacktraces module
        this._require('stacktraces/stacktraces_node.js', NODE);
        this._require('stacktraces/stacktraces_rhino.js', RHINO);

        //Logging framework module
        this._require('logging/logging_stubs.js');
        this._require('logging/logging.js');
        this._require('logging/ConsoleLogger.js');
        this._require('logging/LogHelper.js');

        //Initialize core module that are implementation specific
        this._require('errors/errors.js', NODE);
        this._require('errors/errors_rhino.js', RHINO);

        //Files module
        this._require('files/files.js');
        this._require('files/File_node.js', NODE);
        this._require('files/files_node.js', NODE);
        
        this._require('files/files_rhino.js', RHINO);

        //JavaScript runtime module
        this._require('runtime/runtime.js');
        this._require('runtime/runtime_node.js', NODE);
        this._require('runtime/runtime_rhino.js', RHINO);

        //Packaging module
        this._require('packaging/packaging_server.js');
        this._require('packaging/ExtensionCollection.js');
        this._require('packaging/PackageManifest.js');
        this._require('packaging/PackageLoader.js');
        this._require('packaging/packaging_rhino.js', RHINO);
        
        //Classes module
        this._require('oop/oop.js');
        this._require('oop/oop_server.js');
        this._require('oop/oop_rhino.js');

        //Resources module
        this._require('resources/DirSearchPathEntry.js');
        this._require('resources/FileResource.js');
        this._require('resources/MissingResource.js');
        this._require('resources/Resource.js');
        this._require('resources/SearchPathEntry.js');
        this._require('resources/SearchPath.js');
        this._require('resources/resources.js');
    }
};



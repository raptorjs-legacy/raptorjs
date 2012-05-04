raptorBuilder.addLoader(function(raptor) {

    var logger = raptor.logging.logger('oop-server'),
        errors = raptor.errors,
        getModuleDirPath = function(name) {
            return '/' + name.replace(/\./g, '/');
        },
        loaded = {};
    
    /**
     * @extension Server
     */
    raptor.extendCore('oop', {
        /**
         * 
         * @protected
         * 
         * @param name
         * @returns
         */
        findMissing: function(name) {
            var loaded = this.findMissingClass(name);
            if (loaded === undefined) {
                loaded = this.findMissingModule(name);
            }
            return loaded;
        },
        
        /**
         * 
         * @protected
         * 
         * @param name
         * @returns
         */
        findMissingClass: function(name) {
            var resources = raptor.resources;
            
            var resourcePath = '/' + name.replace(/\./g, '/') + '.js';
            
            var resource = resources.findResourceSync(resourcePath);
            if (resource.exists())
            {
                logger.debug('Found missing class: ' + name);
                
                raptor.runtime.evaluateResource(resource);
                
                var loaded = this._load(name, false /* Do not find again or infinite loop will result */);

                if (loaded == null)
                {
                    var pathToFile = resource.getSystemPath();
                    
                    //The file existed for the class by the class itself
                    //was not found so throw an error since the developer
                    //probably named the class incorrectly.
                    errors.throwError(new Error('Definition with name "' + name + '" not found in file "' + pathToFile + '"'));
                }
                else
                {   
                    return loaded;
                }
            }
            else
            {
                return undefined;                
            }
        },
        
        /**
         * 
         * @protected
         * 
         * @param name
         * @returns
         */
        findMissingModule: function(name) {
            var manifest = this.getModuleManifest(name);
            
            if (!manifest) {
                return undefined;
            } 
            
            raptor.packaging.loadPackage(manifest);
            
            var module = this._load(name, false /* Do not find again or infinite loop will result */);
            return module;
        },
        
        handleMissing: function(name) {
            errors.throwError(new Error('require failed. "' + name + '" not found. Search path:\n' + raptor.resources.getSearchPathString()));
        },
        
        /**
         * 
         * @param name
         * @returns
         */
        getModuleManifest: function(name) {
            var moduleDirPath = getModuleDirPath(name);
            return raptor.packaging.getPackageManifest(moduleDirPath + "/package.json");
        }
    });
    
    raptor.extend(
        raptor.packaging,
        {
            load_module: function(include, manifest) {
                var moduleName = include.name;
                
                if (loaded[moduleName] === true || raptor.find(moduleName)) {
                    return;
                }
                loaded[moduleName] = true;

                var newManifest = raptor.oop.getModuleManifest(moduleName);
                this.loadPackage(newManifest);
            }
        });
});


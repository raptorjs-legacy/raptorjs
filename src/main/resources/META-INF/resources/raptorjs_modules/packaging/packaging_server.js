raptorBuilder.addLoader(function(raptor) {

    var errors = raptor.errors,
        arrays = raptor.arrays,
        forEachEntry = raptor.forEachEntry,
        logger = raptor.logging.logger('packaging-server'),
        packageManifests = {},
        loaded = {},
        _extensionsLookup = {},
        includeHandlers = {},
        includeHandlersDiscovered = false,
        searchPathListenerHandler = null;
    
    /**
     * 
     */
    raptor.defineCore('packaging', {
        config: raptor.config.create({
            "enabledExtensions": {
                value: raptor.getModuleConfig('packaging').enabledExtensions,
                onChange: function(value) {
                    _extensionsLookup = {};
                    
                    arrays.forEach(value, function(ext) {
                        _extensionsLookup[ext] = true;
                    });
                }
            }
        }),
        
        enableExtension: function(extensionName) {
            _extensionsLookup[extensionName] = true;
        },
        
        /**
         * 
         * @param resourcePath {String|packaging-PackageManifest}
         */
        loadPackage: function(resourcePath) {
            this.PackageLoader.instance.loadPackage(resourcePath, {enabledExtensions: _extensionsLookup});
        },
        
        discoverIncludeHandlers: function() {
            this.forEachTopLevelPackageManifest(function(manifest) {
                var includeHandlers = manifest["include-handlers"];
                
                if (includeHandlers) {
                    forEachEntry(includeHandlers, function(type, handlerInfo) {
                        if (handlerInfo.path) {
                            raptor.runtime.evaluateResource(handlerInfo.path);
                        }
                        var HandlerClass = raptor.require(handlerInfo["class"]);
                        if (!HandlerClass.instance) {
                            HandlerClass.instance = new HandlerClass();
                        }
                        this.registerIncludeHandler(type, HandlerClass.instance);
                    }, this);
                }
            }, this);
            
            if (!searchPathListenerHandler) {
                searchPathListenerHandler = raptor.resources.getSearchPath().subscribe("modified", function() {
                    this.discoverIncludeHandlers(); //If the search path is modified then rediscover the 
                }, this);
            }
        },
        
        registerIncludeHandler: function(type, handler) {
            includeHandlers[type] = handler; 
        },
        
        getIncludeHandler: function(type) {
            if (!includeHandlersDiscovered) {                
                this.discoverIncludeHandlers();
                
                
                includeHandlersDiscovered = true;
            }
            return includeHandlers[type];
        },
        
        /**
         * 
         * @param resourcePath
         * @returns
         */
        getPackageManifest: function(resourcePath) {
            
            var resources = raptor.resources,
                packageResource;
            
            if (resources.isResourceInstance(resourcePath)) {
                packageResource = resourcePath;
                resourcePath = packageResource.getPath();
            }
            else {
                packageResource = resources.findResource(resourcePath);
            }
            
            
            
            var manifest = packageManifests[packageResource.getSystemPath()];
            if (manifest === undefined)
            {
                var packageDirPath;

                if (!packageResource.exists())
                {
                    return null;
                }
                
                
                resourcePath = packageResource.getPath();

                packageDirPath = resourcePath.substring(0, resourcePath.lastIndexOf("/"));
                
                logger.debug('Found package manifest: ' + packageResource.getSystemPath());
                
                var packageJson = packageResource.readFully();
                try
                {
                    manifest = JSON.parse(packageJson);
                }
                catch(e) {
                    errors.throwError(new Error('Unable to parse module manifest at path "' + packageResource.getPath() + '". Exception: ' + e + '\n\nJSON:\n' + packageJson), e);
                }
                
                raptor.extend(manifest, this.PackageManifest);
                manifest.init(packageDirPath, packageResource);
                
                packageManifests[packageResource.getSystemPath()] = manifest;
            }
            return manifest;
        },
        
        /**
         * 
         * @param callback {Function}
         * @param thisObj {Object}
         */
        forEachTopLevelPackageManifest: function(callback, thisObj) {
            raptor.resources.forEach('/package.json', function(manifestResource) {
                var manifest = this.getPackageManifest(manifestResource);
                callback.call(thisObj, manifest);
            }, this);
        }
    });

});
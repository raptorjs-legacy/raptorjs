raptorBuilder.addLoader(function(raptor) {

    var errors = raptor.errors,
        arrays = raptor.arrays,
        runtime = raptor.runtime,
        logger = raptor.logging.logger('packaging-server'),
        packageManifests = {},
        loaded = {},
        _extensionsLookup = {};

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
            var manifest = resourcePath._isPackageManifest ? 
                    resourcePath :
                    this.getPackageManifest(resourcePath),
                path = manifest.getPackageResource().getSystemPath();
            
            
            if (loaded[path] === true) {
                return;
            }
            loaded[path] = true;
            
            manifest.forEachInclude({
                callback: function(type, include) {
                    
                    var loadFunc = this["load_" + type];
                    if (!loadFunc) {
                        raptor.errors.throwError(new Error('Unsupported include type: ' + include.type + ". Include: " + JSON.stringify(include)));
                    }
                    else {
                        loadFunc.call(this, include, manifest);
                    }
                },
                enabledExtensions: _extensionsLookup,
                thisObj: this
            });
        },
        
        load_js: function(include, manifest) {
            var resource = manifest.resolveResource(include.path),
                path = resource.getSystemPath();
            
            if (loaded[path] === true) {
                return;
            }
            loaded[path] = true;
            
            runtime.evaluateResource(resource);
        },
        
        /**
         * 
         * @param resourcePath
         * @returns
         */
        getPackageManifest: function(resourcePath) {
            var manifest = packageManifests[resourcePath];
            if (manifest === undefined)
            {
                var packageResource, 
                    packageDirPath,
                    resources = raptor.resources;
                
                packageResource = resources.findResourceSync(resourcePath);
                
                
                
                if (!packageResource.exists())
                {
                    return null;
                }
                
                
                resourcePath = packageResource.getPath();

                packageDirPath = resourcePath.substring(0, resourcePath.lastIndexOf("/"));
                
                logger.debug('Found package manifest: ' + packageResource.getSystemPath());
                
                var packageJson = packageResource.readFullySync();
                try
                {
                    manifest = JSON.parse(packageJson);
                }
                catch(e) {
                    errors.throwError(new Error('Unable to parse module manifest at path "' + packageResource.getPath() + '". Exception: ' + e + '\n\nJSON:\n' + packageJson), e);
                }
                
                raptor.extend(manifest, this.PackageManifest);
                manifest.init(packageDirPath, packageResource);
                
                packageManifests[resourcePath] = manifest;
            }
            return manifest;
        }
    });

});
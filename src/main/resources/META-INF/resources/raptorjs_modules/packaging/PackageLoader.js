$rload(function(raptor) {
    var packaging = raptor.packaging,
        runtime = raptor.runtime,
        loaded = {};
    
    var PackageLoader = function() {
        this._loaded = {};
    };
    
    PackageLoader.prototype = {
        /**
         * 
         * @param resourcePath {String|packaging-PackageManifest}
         */
        loadPackage: function(resourcePath, options) {
            var manifest = resourcePath._isPackageManifest ? 
                    resourcePath :
                    packaging.getPackageManifest(resourcePath),
                path = manifest.getPackageResource().getSystemPath(),
                enabledExtensions = options.enabledExtensions;
            
            
            if (loaded[path] === true) {
                return;
            }
            
            loaded[path] = true;
            
            manifest.forEachInclude({
                callback: function(type, include) {
                    var handler = packaging.getIncludeHandler(type);
                    if (!handler) {
                        raptor.errors.throwError(new Error('Handler not found for include of type "' + include.type + '". Include: ' + JSON.stringify(include)));
                    }
                    else {
                        var loadFunc = handler.load;
                        if (!loadFunc) {
                            raptor.errors.throwError(new Error('"load" function not found for include handler of type "' + include.type + '". Include: ' + JSON.stringify(include)));
                        }
                        loadFunc.call(handler, include, manifest, this);
                    }
                },
                enabledExtensions: enabledExtensions,
                thisObj: this
            });
        },
        
        setLoaded: function(path) {
            this._loaded[path] = true;
        },
        
        isLoaded: function(path) {
            return this._loaded[path] === true;
        }
    };
    
    packaging.PackageLoader = PackageLoader;
    
    packaging.PackageLoader.instance = new PackageLoader();
});


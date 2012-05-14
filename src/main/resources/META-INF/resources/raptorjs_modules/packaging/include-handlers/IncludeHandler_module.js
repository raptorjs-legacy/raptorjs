raptor.defineClass(
    "packaging.include-handlers.IncludeHandler_module",
    "packaging.IncludeHandler",
    function() {

        return {
            includeKey: function(include) {
                return "module:" + include.name;
            },
            
            load: function(include, manifest, loader) {
                var moduleName = include.name;
                
                if (loader.isLoaded(moduleName)) {
                    return;
                }
                loader.setLoaded(moduleName);
                
                
                
                var newManifest = raptor.oop.getModuleManifest(moduleName);
                raptor.packaging.loadPackage(newManifest);
            },

            getManifest: function(include) {
                return raptor.oop.getModuleManifest(include.name);
            },
            
            _isPackageInclude: function() {
                return true;
            }
        };
    });



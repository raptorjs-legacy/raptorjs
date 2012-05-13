raptor.defineClass(
    "packaging.include-types.IncludeType_module",
    function() {

        return {
            load: function(include, manifest, loader) {
                var moduleName = include.name;
                
                if (loader.isLoaded(moduleName)) {
                    return;
                }
                loader.setLoaded(moduleName);
                
                
                
                var newManifest = raptor.oop.getModuleManifest(moduleName);
                raptor.packaging.loadPackage(newManifest);
            },
            
            aggregate: function(include, manifest) {
                if (!this.isIncludeDependenciesEnabled()) {
                    return false;
                }
                
                var moduleName = include.name;
                
                if (!this.isIncluded(moduleName)) {
                    this.setIncluded(moduleName);
                    this.aggregatePackage(raptor.oop.getModuleManifestPath(moduleName));
                }
            }
        };
    });



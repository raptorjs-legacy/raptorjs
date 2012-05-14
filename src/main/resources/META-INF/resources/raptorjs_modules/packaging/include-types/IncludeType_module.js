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
            
            aggregate: function(include, manifest, aggregator) {
                if (!aggregator.isIncludeDependenciesEnabled()) {
                    return false;
                }
                
                var moduleName = include.name;
                
                if (!aggregator.isIncluded(moduleName)) {
                    aggregator.setIncluded(moduleName);
                    aggregator.aggregatePackage(raptor.oop.getModuleManifestPath(moduleName));
                }
            }
        };
    });



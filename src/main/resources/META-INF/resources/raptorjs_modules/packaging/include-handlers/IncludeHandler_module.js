raptor.defineClass(
    "packaging.include-handlers.IncludeHandler_module",
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
            
            aggregate: function(include, manifest, aggregator) {
                aggregator.addRequires(include); //Add the module as a requires
            },
            
            getManifest: function(include) {
                return raptor.oop.getModuleManifest(include.name);
            },
            
            isPackage: function() {
                return true;
            }
        };
    });



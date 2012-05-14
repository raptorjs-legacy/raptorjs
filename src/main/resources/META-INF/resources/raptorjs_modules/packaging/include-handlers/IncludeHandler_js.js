raptor.defineClass(
    "packaging.include-handlers.IncludeHandler_js",
    "packaging.IncludeHandler",
    function() {
        var loaded = {},
            runtime = raptor.require('runtime');
        
        return {
            includeKey: function(include) {
                return "js:" + include.path;
            },
            
            load: function(include, manifest, loader) {
                var resource = manifest.resolveResource(include.path),
                path = resource.getSystemPath();
                
                
                
                if (loader.isLoaded(path)) {
                    return;
                }
                
                loader.setLoaded(path);
                
                runtime.evaluateResource(resource);
            },
            
            aggregate: function(include, manifest, aggregator) {
                var resource = manifest.resolveResource(include.path);
                aggregator.addResourceCode("js", resource);
            }
        };
    });

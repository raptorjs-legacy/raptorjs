raptor.defineClass(
    "packaging.include-types.IncludeType_js",
    function() {
        var loaded = {},
            runtime = raptor.require('runtime');
        
        return {
            load: function(include, manifest, loader) {
                var resource = manifest.resolveResource(include.path),
                path = resource.getSystemPath();
                
                
                
                if (loader.isLoaded(path)) {
                    return;
                }
                
                loader.setLoaded(path);
                
                runtime.evaluateResource(resource);
            },
            
            aggregate: function(include, manifest) {
                var resource = manifest.resolveResource(include.path);
                this.addResourceCode("js", resource);
            }
        };
    });

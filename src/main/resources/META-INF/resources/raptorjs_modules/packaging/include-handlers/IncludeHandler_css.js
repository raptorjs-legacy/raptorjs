raptor.defineClass(
    "packaging.include-handlers.IncludeHandler_css",
    "packaging.IncludeHandler",
    function() {
        return {
            includeKey: function(include) {
                return "css:" + include.path;
            },
            
            aggregate: function(include, manifest, aggregator) {
                var resource = manifest.resolveResource(include.path);
                aggregator.addResourceCode("css", resource);
            }
        };
    });

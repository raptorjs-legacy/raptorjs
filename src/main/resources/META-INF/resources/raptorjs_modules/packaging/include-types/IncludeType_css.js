raptor.defineClass(
    "packaging.include-types.IncludeType_css",
    function() {
        return {
            aggregate: function(include, manifest) {
                var resource = manifest.resolveResource(include.path);
                this.addResourceCode("css", resource);
            }
        };
    });

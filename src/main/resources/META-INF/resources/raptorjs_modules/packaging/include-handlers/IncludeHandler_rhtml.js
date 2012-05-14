raptor.defineClass(
    "packaging.include-handlers.IncludeHandler_rhtml",
    function() {
        return {
            load: function(include, manifest) {
                var resource = manifest.resolveResource(include.path);
                var xmlSource = resource.readFully();
                raptor.require("templating.compiler").compileAndLoad(xmlSource, resource.getSystemPath());
            },
            
            aggregate: function(include, manifest, aggregator) {
                var resource = manifest.resolveResource(include.path);
                var xmlSource = resource.readFully();
                var rhtmlJs = raptor.require("templating.compiler").compile(xmlSource, resource.getSystemPath());
                aggregator.addJavaScriptCode(rhtmlJs, resource.getSystemPath());
            }
        };
    });

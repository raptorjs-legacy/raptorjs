raptor.defineClass(
    "packaging.include-types.IncludeType_rhtml",
    function() {
        return {
            load: function(include, manifest) {
                var resource = manifest.resolveResource(include.path);
                var xmlSource = resource.readFully();
                raptor.require("templating.compiler").compileAndLoad(xmlSource, resource.getSystemPath());
            },
            
            aggregate: function(include, manifest) {
                var resource = manifest.resolveResource(include.path);
                var xmlSource = resource.readFully();
                var rhtmlJs = raptor.require("templating.compiler").compile(xmlSource, resource.getSystemPath());
                this.addJavaScriptCode(rhtmlJs, resource.getSystemPath());
            }
        };
    });

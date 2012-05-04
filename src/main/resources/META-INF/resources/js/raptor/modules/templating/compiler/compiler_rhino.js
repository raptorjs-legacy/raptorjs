/**
 * @extension Server
 */
raptor.extend(
    "templating.compiler",
    function(raptor, compiler) {

        var java = raptor.require("java");
        
        var convertJavaOptions = function(javaOptions) {
            var options = {};
            options.templateName = java.convertString(javaOptions.templateName);
        };
        
        return {
            rhinoCompile: function(src, path, javaOptions) {
                return this.compile(src, path, convertJavaOptions(javaOptions));
            },
            
            rhinoCompileResource: function(path, javaOptions) {
                return this.compileResource(path, convertJavaOptions(javaOptions));
            },
            
            rhinoCompileAndLoadResource: function(path, javaOptions) {
                return this.compileAndLoadResource(path, convertJavaOptions(javaOptions));
            }
        };
    });
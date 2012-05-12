/**
 * @extension Rhino
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
            /**
             * 
             * @param src
             * @param path
             * @param javaOptions
             * @returns
             */
            rhinoCompile: function(src, path, javaOptions) {
                return this.compile(src, path, convertJavaOptions(javaOptions));
            },
            
            /**
             * 
             * @param path
             * @param javaOptions
             * @returns
             */
            rhinoCompileResource: function(path, javaOptions) {
                return this.compileResource(path, convertJavaOptions(javaOptions));
            },
            
            /**
             * 
             * @param path
             * @param javaOptions
             * @returns
             */
            rhinoCompileAndLoadResource: function(path, javaOptions) {
                return this.compileAndLoadResource(path, convertJavaOptions(javaOptions));
            }
        };
    });
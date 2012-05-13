

raptorBuilder.addLoader(function(raptor) {
    
    var JavaFile = Packages.java.io.File;
    
    /**
     * @extension Node
     */
    raptor.extendCore('files', {
        /**
         * 
         * @param path
         * @returns
         */
        exists: function(path) {
            return new JavaFile(path).exists();
        },
        
        /**
         * 
         * @param paths
         * @returns
         */
        joinPaths: function(paths) {
            if (arguments.length === 2) {
                return new JavaFile(arguments[0], arguments[1]).getAbsolutePath();
            }
            else {
                raptor.errors.throwError(new Error("Not supported"));
            }
        },
        
        /**
         * 
         * @param path
         * @param encoding
         * @returns
         */
        readFully: function(path, encoding) {
            if (encoding == null) encoding = "UTF-8";
            return __rhinoHelpers.getFiles().readFully(new JavaFile(path), encoding);
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isDirectory: function(path) {
            return new JavaFile(path).isDirectory();
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isFile: function(path) {
            return new JavaFile(path).isFile();
        },
        
        /**
         * 
         * @param dirPath
         * @returns
         */
        listFilenames: function(dirPath) {
            var javaFile = new JavaFile(dirPath);
            var filenames = javaFile.list();
            return raptor.java.convertArray(filenames);
        }
    });

});
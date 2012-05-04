

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
        existsSync: function(path) {
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
        readFileSync: function(path, encoding) {
            if (encoding == null) encoding = "UTF-8";
            return __rhinoHelpers.getFiles().readFile(new JavaFile(path), encoding);
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isDirectorySync: function(path) {
            return new JavaFile(path).isDirectory();
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isFileSync: function(path) {
            return new JavaFile(path).isFile();
        },
        
        /**
         * 
         * @param dirPath
         * @returns
         */
        listFilenamesSync: function(dirPath) {
            var javaFile = new JavaFile(dirPath);
            var filenames = javaFile.list();
            return raptor.java.convertArray(filenames);
        }
    });

});
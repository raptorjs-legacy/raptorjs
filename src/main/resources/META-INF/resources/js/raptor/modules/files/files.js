raptorBuilder.addLoader(function(raptor) {
    raptor.defineCore('files', {
        /**
         * 
         * @param path
         */
        existsSync : function(path) {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         */
        joinPaths: function() {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         * @param path
         * @param encoding
         */
        readFileSync: function(path, encoding) {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isDirectorySync: function(path) {
            return this.statSync(path).isDirectory();
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isFileSync: function(path) {
            return this.statSync(path).isFile();
        }
    });
});
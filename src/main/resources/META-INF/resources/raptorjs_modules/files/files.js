$rload(function(raptor) {
    raptor.defineCore('files', {
        /**
         * 
         * @param path
         */
        exists: function(path) {
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
        readFully: function(path, encoding) {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isDirectory: function(path) {
            throw new Error('Not Implemented');
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isFile: function(path) {
            throw new Error('Not Implemented');
        },
        
        remove: function(path) {
            var file = new raptor.files.File(path);
            file.remove();
        }
    });
});
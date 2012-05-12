raptorBuilder.addLoader(function(raptor) {
    
    var nodePath = require('path'), 
        nodeFs = require('fs'),
        statSync = function(path) {
            return nodeFs.statSync(path);
        };
    
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
            return nodePath.existsSync(path);
        },
        
        /**
         * 
         * @param paths
         * @returns
         */
        joinPaths: function(paths) {
            return nodePath.join.apply(nodePath, arguments);
        },
        
        /**
         * 
         * @param path
         * @param encoding
         * @returns
         */
        readFile: function(path, encoding) {
            if (encoding == null) encoding = "UTF-8";
            return nodeFs.readFileSync(path, encoding);
        },
        
        /**
         * 
         */
        isDirectory: function(path) {
            return statSync(path).isDirectory();
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isFile: function(path) {
            return statSync(path).isFile();
        },
        
        /**
         * 
         * @param dirPath
         * @param callback
         * @param thisObj
         * @returns
         */
        listFilenames: function(dirPath, callback, thisObj) {
            var files = nodeFs.readdirSync(dirPath);
            return files;
        },
        
        writeFile: function(path, data, encoding) {
            nodeFs.writeFileSync(path, data, encoding || "UTF-8");
        }
    });

});
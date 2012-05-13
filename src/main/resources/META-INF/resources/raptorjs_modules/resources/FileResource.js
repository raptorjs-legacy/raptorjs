raptorBuilder.addLoader(function(raptor) {
    
    var forEach = raptor.forEach;
    
    /**
     * @protected
     */
    raptor.defineClass(
        'resources.FileResource', 
        {
            superclass: 'resources.Resource'
        },
        
        function() {
            var files = raptor.files;

            /**
             * @constructs
             */
            var FileResource = function(searchPathEntry, path, filePath) {
                FileResource.superclass.init.call(this, searchPathEntry, path);               
                if (!filePath) {
                    raptor.throwError(new Error("filePath is required: " + filePath));
                }
                this.filePath = filePath;
            };
            
            FileResource.prototype = {
                    /**
                     * 
                     * @returns {Boolean}
                     */
                isFileResource: function() {
                    return true;
                },
                    
                getFilePath: function() {
                    return this.filePath;
                },
                
                getSystemPath: function() {
                    return this.filePath;
                },
                
                readFully: function() {
                    return files.readFully(this.getFilePath());
                },
                
                isDirectory: function() {
                    return files.isDirectory(this.filePath);
                },
                
                isFile: function() {
                    return files.isFile(this.filePath);
                },
                
                forEachChild: function(callback, thisObj) {
                    var filenames = files.listFilenames(this.filePath),
                        FileResource = raptor.require('resources.FileResource');
                    
                    forEach(filenames, function(filename) {
                        var childResource = new FileResource(
                                this.getSearchPathEntry(),
                                this.getPath() == "/" ? '/' + filename : this.getPath() + '/' + filename, 
                                files.joinPaths(this.filePath, filename));
                        
                        callback.call(thisObj, childResource);
                        
                    }, this);
                },
                
                writeFully: function(str, encoding) {
                    files.writeFile(this.filePath, str, encoding);
                }
            };
            return FileResource;
        });
});
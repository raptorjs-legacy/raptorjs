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
                
                readFullySync: function() {
                    return files.readFileSync(this.getFilePath());
                },
                
                isDirectorySync: function() {
                    return files.isDirectorySync(this.filePath);
                },
                
                isFileSync: function() {
                    return files.isFileSync(this.filePath);
                },
                
                forEachChildSync: function(callback, thisObj) {
                    var filenames = files.listFilenamesSync(this.filePath),
                        FileResource = raptor.require('resources.FileResource');
                    
                    forEach(filenames, function(filename) {
                        var childResource = new FileResource(
                                this.getPath() + '/' + filename, 
                                files.joinPaths(this.filePath, filename));
                        
                        callback.call(thisObj, childResource);
                        
                    }, this);
                }
            };
            return FileResource;
        });
});
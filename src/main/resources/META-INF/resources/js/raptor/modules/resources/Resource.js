raptorBuilder.addLoader(function(raptor) {
    raptor.defineClass('resources.Resource', function(raptor) {
    
        return {
            /**
             * 
             * @param path
             * @returns {void}
             */
            init: function(searchPathEntry, path) {
                this.setSearchPathEntry(searchPathEntry);
                this.setPath(path);
            },
            
            /**
             * 
             * @param {String} path
             * @returns {void}
             */
            setPath: function(path) {
                this.path = path;
            },
            
            /**
             * Returns the path to the resource.
             * 
             * A path is always normalized so that it uses forward slashes as part
             * separators and it will always being with a forward slash.
             * 
             * @returns {String} The path for the resource
             */
            getPath: function() {
                return this.path;
            },
            
            /**
             * 
             * @returns {Boolean} Returns true if the resource is of type resources.FileResource, false otherwise
             */
            isFileResource: function() {
                return false;
            },
            
            /**
             * 
             * @returns {String} The name of the resource
             */
            getName: function() {
                if (this._name == null)
                {
                    this._name = this.path.substring(this.path.lastIndexOf('/') + 1);
                }
                return this._name;                
            },
            
            /**
             * 
             * @returns
             */
            getSystemPath: function() {
                raptor.errors.throwError(new Error('Not Implemented'));
            },
            
            /**
             * 
             * @returns
             */
            readFullySync: function() {
                raptor.errors.throwError(new Error('Not Implemented'));
            },
            
            /**
             */
            toString: function() {
                return '[' + this.className + ': path=' + this.getPath() + ', systemPath=' + this.getSystemPath() + ']';
            },
            
            /**
             * 
             * @returns
             */
            exists: function() {
                return true;
            },
            
            /**
             * 
             * @param childPath
             * @returns
             */
            findChildSync: function(childPath) {
                var resources = raptor.resources;
                
                return resources.findResourceSync(
                        resources.joinPaths(this.getPath(), childPath));
            },
            
            /**
             * 
             * @param searchPathEntry
             * @returns
             */
            setSearchPathEntry: function(searchPathEntry) {
                this.searchPathEntry = searchPathEntry;
            },
            
            /**
             * 
             * @returns
             */
            getSearchPathEntry: function() {
                
            }
        
        };
    });
});
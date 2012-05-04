raptorBuilder.addLoader(function(raptor) {
    raptor.defineClass(
        'resources.DirSearchPathEntry',
        {
            superclass: 'resources.SearchPathEntry'
        },
        function() {
    
            var files = raptor.require('files'),
                FileResource = raptor.require('resources.FileResource'),
                logger = raptor.logging.logger('resources.DirSearchPathEntry');
    
            return {
                /**
                 * 
                 * @param dir
                 * @returns
                 */
                init: function(dir) {
                    this.dir = dir;
                },
            
                /**
                 * 
                 * @param path
                 * @returns
                 */
                findResourceSync: function(path) {
                    var fullPath = files.joinPaths(this.dir, path),
                        fileResource;
                    
                    if (files.existsSync(fullPath)) {
                        logger.debug('Resource "' + path + '" EXISTS in directory "' + this.dir + '"');
                        fileResource = new FileResource(this, path, fullPath);
                        return fileResource;
                    }
                    else
                    {
                        logger.debug('Resource "' + path + '" does not exist in directory "' + this.dir + '"');
                    }
                    return null;
                },
                
                /**
                 */
                toString: function() {
                    return '[DirSearchPathEntry: ' + this.dir + ']';
                }
            };
        });

});
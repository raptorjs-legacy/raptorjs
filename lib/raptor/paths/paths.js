define(
    "raptor/paths",
    function(require, exports, module) {
        "use strict";
        
        return {
            /**
             * Resolves a possibly path relative to a directory to an absolute path.
             */
            resolve: function(dirPath, relativePath) {
                
                if (relativePath.charAt(0) === '/') {
                    return relativePath;
                }
                
                var parts = relativePath.split('/'),
                    pathParts = dirPath.split('/');
                
                for (var i=0, len=parts.length; i<len; i++) {
                    var part = parts[i];
                    if (part === '..') {
                        pathParts.splice(pathParts.length-1, 1); //Remove the last element
                    }
                    else if (part !== '.') {
                        pathParts.push(part);
                    }
                }
                
                return pathParts.join('/');
            }
        };
    });
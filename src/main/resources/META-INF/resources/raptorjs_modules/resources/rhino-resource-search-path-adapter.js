



(function() {
    var java = raptor.require('java');
    
    var Resource = raptor.defineClass(
        {
            superclass: 'resources.Resource'
        },
        function(raptor) {
            var Resource = function(javaResource, searchPathEntry) {
                Resource.superclass.constructor.call(
                    this, 
                    searchPathEntry, 
                    java.convertString(javaResource.getPath()));
                
                this.javaResource = javaResource;
            };
            
            Resource.prototype = {
                isFileResource: function() {
                    return this.javaResource.fileResource === true;
                },

                
                getSystemPath: function() {
                    return java.convertString(this.javaResource.getSystemPath());
                },
                
                readFullySync: function() {
                    return java.convertString(this.javaResource.readAsString());
                },
                
                isDirectorySync: function() {
                    return this.javaResource.isDirectory();
                },
                
                isFileSync: function() {
                    return this.javaResource.isFile();
                },
                
                forEachChildSync: function(callback, thisObj) {
                    throw new Error("ebay.resources.Resource.forEachChildSync() not implemented");
                }
            };
            
            return Resource;
        });
    
    var ResourceSearchPathEntry = raptor.defineClass(
        {
            superclass: 'resources.SearchPathEntry'
        },
        function(raptor) {
            var ResourceSearchPathEntry = function() {
                ResourceSearchPathEntry.superclass.constructor.call(this);
            };
            
            ResourceSearchPathEntry.prototype = {
                findResourceSync: function(path) {
                    var javaResource = __rhinoHelpers.resources.findResource(path);
                    if (javaResource) {
                        return new Resource(javaResource, this);
                    }
                    return null;
                }
            };
            
            return ResourceSearchPathEntry;
        });

    raptor.require("resources").addSearchPathEntry(new ResourceSearchPathEntry());
}());

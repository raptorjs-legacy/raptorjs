



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
                
                readFully: function() {
                    return java.convertString(this.javaResource.readAsString());
                },
                
                isDirectory: function() {
                    return this.javaResource.isDirectory();
                },
                
                isFile: function() {
                    return this.javaResource.isFile();
                },
                
                forEachChild: function(callback, thisObj) {
                    throw new Error("ebay.resources.Resource.forEachChild() not implemented");
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
                findResource: function(path) {
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

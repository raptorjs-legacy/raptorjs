$rload(function(raptor) {
    "use strict";
    
    raptor.defineClass(
        'resources.RhinoResourceAdapter',
        {
            superclass: 'resources.Resource'
        },
        function(raptor) {
            var java = raptor.require('java');
            
            var RhinoResourceAdapter = function(javaResource) {
                var javaSearchPathEntry = javaResource.getSearchPathEntry();
                var RhinoSearchPathEntryAdapter = raptor.require('resources.RhinoSearchPathEntryAdapter');
                var searchPathEntry = new RhinoSearchPathEntryAdapter(javaSearchPathEntry);
                
                RhinoResourceAdapter.superclass.constructor.call(
                    this, 
                    searchPathEntry, 
                    java.convertString(javaResource.getPath()));
                
                this.javaResource = javaResource;
                
                
            };
            
            RhinoResourceAdapter.prototype = {
                isFileResource: function() {
                    return this.javaResource.fileResource === true;
                },
    
                
                getSystemPath: function() {
                    return java.convertString(this.javaResource.getSystemPath());
                },
                
                readAsString: function(encoding) {
                    if (!encoding) {
                        encoding = "UTF-8";
                    }
                    return java.convertString(this.javaResource.readAsString(encoding));
                },
                
                isDirectory: function() {
                    return this.javaResource.isDirectory();
                },
                
                isFile: function() {
                    return this.javaResource.isFile();
                },
                
                resolve: function(relPath) {
                    var resolvedJavaResource = this.javaResource.resolve(relPath);
                    return new RhinoResourceAdapter(resolvedJavaResource);
                }
            };
            
            return RhinoResourceAdapter;
        });
    
});
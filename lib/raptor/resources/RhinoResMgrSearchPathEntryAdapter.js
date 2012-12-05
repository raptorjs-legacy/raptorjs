$rload(function(raptor) {
    "use strict";
    
    raptor.defineClass(
        'resources.RhinoResMgrSearchPathEntryAdapter',
        'resources.SearchPathEntry',
        function(raptor) {
            var RhinoResourceAdapter = raptor.require('resources.RhinoResourceAdapter');
            
            var RhinoResMgrSearchPathEntryAdapter = function() {
                RhinoResMgrSearchPathEntryAdapter.superclass.constructor.call(this);
            };
            
            RhinoResMgrSearchPathEntryAdapter.prototype = {
                findResource: function(path) {
                    var javaResource = __rhinoHelpers.resources.findResource(path);
                    if (javaResource) {
                        return new RhinoResourceAdapter(javaResource, this);
                    }
                    return null;
                },
                
                forEachResource: function(path, callback, thisObj) {
                	__rhinoHelpers.resources.forEachResource(path, function(javaResource) {
                		var resource = new RhinoResourceAdapter(javaResource, this);
                		callback.call(thisObj, resource);
                	}, null);
                }
            };
            
            return RhinoResMgrSearchPathEntryAdapter;
        });
    
});


$rload(function(raptor) {
    "use strict";
    
    raptor.defineClass(
        'resources.RhinoSearchPathEntryAdapter',
        'resources.SearchPathEntry',
        function(raptor) {
            var RhinoResourceAdapter = raptor.require('resources.RhinoResourceAdapter');
            
            var RhinoSearchPathEntryAdapter = function(javaSearchPathEntry) {
                RhinoSearchPathEntryAdapter.superclass.constructor.call(this);
                this.javaSearchPathEntry = javaSearchPathEntry;
            };
            
            RhinoSearchPathEntryAdapter.prototype = {
                findResource: function(path) {
                    var javaResource = this.javaSearchPathEntry.findResource(path);
                    if (javaResource) {
                        return new RhinoResourceAdapter(javaResource);
                    }
                    return null;
                }
            };
            
            return RhinoSearchPathEntryAdapter;
        });
    
});


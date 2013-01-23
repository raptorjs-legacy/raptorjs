define.Class(
    'raptor/resources/RhinoSearchPathEntryAdapter',
    'raptor/resources/SearchPathEntry',
    function(require, exports, module) {
        "use strict";
        
        var RhinoResourceAdapter = require('raptor/resources/RhinoResourceAdapter');
        
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
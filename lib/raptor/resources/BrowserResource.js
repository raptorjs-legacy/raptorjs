raptor.define(
    'resources.BrowserResource',
    'resources.Resource',
    function() {
        "use strict";
        
        var BrowserResource = function(searchPathEntry, path, contents) {
            BrowserResource.superclass.constructor.call(this, searchPathEntry, path);
            this.path = path;
            this.contents = contents;
        };
        
        BrowserResource.prototype = {
            readAsString: function() {
                return this.contents;
            },
            
            getSystemPath: function() {
                return this.path;
            }
        };
        
        return BrowserResource;
    });
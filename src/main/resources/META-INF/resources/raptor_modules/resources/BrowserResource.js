raptor.define(
    'resources.BrowserResource',
    'resources.Resource',
    function() {
        var BrowserResource = function(searchPathEntry, path, contents) {
            BrowserResource.superclass.constructor.call(this, searchPathEntry, path);
            this.path = path;
            this.contents = contents;
        };
        
        BrowserResource.prototype = {
            readFully: function() {
                return this.contents;
            },
            
            getSystemPath: function() {
                return this.path;
            }
        };
        
        return BrowserResource;
    });
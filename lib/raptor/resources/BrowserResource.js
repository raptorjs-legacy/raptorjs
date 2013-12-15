define(
    'raptor/resources/BrowserResource',
    'raptor/resources/Resource',
    function(require, exports, module) {
        'use strict';
        
        var BrowserResource = function(searchPathEntry, path, contents) {
            BrowserResource.superclass.constructor.call(this, searchPathEntry, path);
            this.path = path;
            this.contents = contents;
        };
        
        BrowserResource.prototype = {
            readAsString: function() {
                return this.contents;
            },
            
            getURL: function() {
                return this.path;
            }
        };
        
        return BrowserResource;
    });
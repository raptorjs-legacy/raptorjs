raptor.defineClass(
    "resources.walker.DirWalker",
    function(raptor) {
        var listeners = raptor.require("listeners"),
            resources = raptor.require('resources');
        
        var DirWalker = function(callbackFunc, thisObj, options) {
            this.callbackThisObj = thisObj;
            this.callbackFunc = callbackFunc;
            
            if (options) {
                
                this.resourceFilter = options.resourceFilter;
                this.dirTraverseFilter = options.dirTraverseFilter;
            }
        };
        
        DirWalker.prototype = {
            walkDir: function(dir) {
                if (typeof dir === 'string') {
                    dir = resources.findResource(dir);
                }
                
                this._handleResource(dir);
            },

            _handleResource: function(resource) {
                var callbackThisObj = this.callbackThisObj,
                    resourceFilter = this.resourceFilter,
                    dirTraverseFilter = this.dirTraverseFilter;
                
                if (!resourceFilter || resourceFilter.call(callbackThisObj, resource)) {
                    this.callbackFunc.call(callbackThisObj, resource);
                }
                
                if (resource.isDirectory()) {
                    if (!dirTraverseFilter || dirTraverseFilter.call(callbackThisObj, resource) !== false) {
                        resource.forEachChild(this._handleResource, this);
                    }
                }
            }
        };
        
        return DirWalker;
    });
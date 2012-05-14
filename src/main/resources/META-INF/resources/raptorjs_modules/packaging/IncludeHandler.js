raptor.defineClass(
    "packaging.IncludeHandler",
    function() {
        return {
            includeKey: function(include) {
                return "css:" + include.path;
            },
            
            isPackageInclude: function(include) {
                return this._isPackageInclude && this._isPackageInclude(include);
            }
        };
    });

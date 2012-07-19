raptor.defineClass(
    'optimizer.BundleDef',
    function(raptor) {
        var BundleDef = function() {
            this.name = null;
            this.includes = [];
            this.bundleSetsByName = {};
        };

        BundleDef.prototype = {
            addInclude: function(include) {
                this.includes.push(include);
            },
            forEachInclude: function(callback, thisObj) {
                raptor.forEach(this.includes, callback, thisObj);
            },
            toString: function() {
                return "[BundleDef name=" + this.name + ", includes=[" + this.includes.join(",") + "]]";
            }
        };
        
        return BundleDef;
    });
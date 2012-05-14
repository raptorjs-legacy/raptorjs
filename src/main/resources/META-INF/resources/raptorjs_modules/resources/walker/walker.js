raptor.defineModule('resources.walker', function() {
    var Walker = raptor.require("resources.walker.DirWalker");
    
    return {
        walk: function(dir, callback, thisObj, options) {
            var walker = new Walker(callback, thisObj, options);
            walker.walkDir(dir);
        }
    };
});
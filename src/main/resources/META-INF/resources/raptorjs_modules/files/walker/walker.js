raptor.defineModule('files.walker', function() {
    var Walker = raptor.require("files.walker.DirWalker");
    
    return {
        walk: function(dir, callback, thisObj, options) {
            var walker = new Walker(callback, thisObj, options);
            walker.walkDir(dir);
        }
    };
});
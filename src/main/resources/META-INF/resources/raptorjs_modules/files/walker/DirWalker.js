raptor.defineClass(
    "files.walker.DirWalker",
    function(raptor) {
        var listeners = raptor.require("listeners"),
            File = raptor.require('files').File;
        
        var DirWalker = function(callbackFunc, thisObj, options) {
            this.callbackThisObj = thisObj;
            this.callbackFunc = callbackFunc;
            
            if (options) {
                
                this.fileFilter = options.fileFilter;
                this.dirTraverseFilter = options.dirTraverseFilter;
            }
        };
        
        DirWalker.prototype = {
            walkDir: function(dir) {
                if (typeof dir === 'string') {
                    dir = new File(dir);
                }
                
                this._handleFile(dir);
            },

            _handleFile: function(file) {
                var callbackThisObj = this.callbackThisObj,
                    fileFilter = this.fileFilter,
                    dirTraverseFilter = this.dirTraverseFilter;
                
                if (!fileFilter || fileFilter.call(callbackThisObj, file)) {
                    this.callbackFunc.call(callbackThisObj, file);
                }
                
                if (file.isDirectory()) {
                    if (!dirTraverseFilter || dirTraverseFilter.call(callbackThisObj, file) !== false) {
                        file.forEachFile(this._handleFile, this);
                    }
                }
            }
        };
        
        return DirWalker;
    });
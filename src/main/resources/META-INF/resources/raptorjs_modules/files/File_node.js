raptorBuilder.addLoader(function(raptor) {
    
    
    var nodePath = require("path"),
        nodeFS = require("fs");
        
    var File = function(path) {
        this._path = path;
        this._stat = null;
    };
    
    File.prototype = {
        _getStat: function() {
            if (!this._stat) {
                this._stat = nodeFS.statSync(this._path);
            }
            return this._stat;
        },
        
        exists: function() {
            return this.nodePath.existsSync(this._path);
        },
        
        isDirectory: function() {
            return this._getStat().isDirectory();
        },
        
        isFile: function() {
            return this._getStat().isFile();
        },
        
        isSymbolicLink: function() {
            return this._getStat().isSymbolicLink();
        },
        
        getAbsolutePath: function() {
            return this._path;
        },
        
        getName: function() {
            return nodePath.basename(this._path);
        },
        
        getParent: function() {
            return nodePath.dirname(this._path);
        },
        
        toString: function() {
            return this.getAbsolutePath();
        },
        
        readSymbolicLink: function() {
            var linkPath = nodeFS.readLinkSync(this._path);
            var path = nodePath.resolve(this.getParent(), linkPath);
            return new File(path);
        },
        
        listFiles: function() {
            var path = this._path;
            
            if (!nodePath.existsSync(path)) {
                raptor.throwError(new Error("File does not exist: " + path));
            }
            
            
            if (this.isSymbolicLink()) {
                this.readSymbolicLink().listFiles();
                return;
            }
            
            var filenames = nodeFS.readdirSync(this._path);
            var files = new Array(filenames.length);
            
            for (var i=0, len=filenames.length; i<len; i++) {
                files[i] = new File(nodePath.join(this._path, filenames[i]));
            }
            
            return files;
        },
        
        forEachFile: function(callback, thisObj) {
            var files = this.listFiles();
            
            for (var i=0, len=files.length; i<len; i++) {
                callback.call(thisObj, files[i]);
            }
        }
    };
    
    raptor.files.File = File;
});
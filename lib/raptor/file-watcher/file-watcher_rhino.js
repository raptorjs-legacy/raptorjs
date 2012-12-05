define.extend(
    'raptor/file-watcher',
    function(require) {
        "use strict";
        
        
        var Watcher = function(javaWatcher, file) {
            this.javaWatcher = javaWatcher;
            this.filename = file;
        };
        
        Watcher.prototype = {
            closeWatcher: function() {
                this.javaWatcher.closeWatcher();
            }    
        };
        
        
        return {
            watch: function(file, callback, thisObj, options) {
                
                var javaWatcher = null;
                
                var watcher = null,
                    rhinoCallback = function(eventName, filename) {
                        callback.call(thisObj, {
                            event: eventName,
                            filename: file,
                            watcher: javaWatcher,
                            closeWatcher: function() {
                                watcher.close();
                            }
                        });
                    };
                
                var javaWatcher = __rhinoHelpers.getFileWatcher().watchFile(file, rhinoCallback, this, options);
                watcher = new Watcher(javaWatcher, file);
                return watcher;
            }
        };
    });
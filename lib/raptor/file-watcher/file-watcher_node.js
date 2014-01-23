define.extend('raptor/file-watcher', function (require) {
    'use strict';
    var fs = require('fs');
    return {
        watch: function (file, callback, thisObj, options) {
            var watcher, nodeCallback = function (eventName, filename) {
                    callback.call(thisObj, {
                        event: eventName,
                        filename: file,
                        watcher: watcher,
                        closeWatcher: function () {
                            watcher.close();
                        }
                    });
                };
            watcher = fs.watch(file, nodeCallback, options);
            return watcher;
        }
    };
});
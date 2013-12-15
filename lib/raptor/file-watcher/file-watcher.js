define(
    'raptor/file-watcher',
    ['raptor'],
    function(raptor, require, exports, module) {
        'use strict';
        
        var createFilenameMatcherFromPatterns = function(patterns) {
                var regExpArray = [],
                    regexp = require('raptor/regexp');
                for (var i=0, len=patterns.length, pattern; i<len; i++) {
                    pattern = patterns[i];
                    regExpArray.push(regexp.simple(pattern));
                }
                
                return function(filename) {
                    for (i=0, len=regExpArray.length; i<len; i++) {
                        if (regExpArray[i].test(filename)) {
                            return true;
                        }
                    }
                    return false;
                };
            },
            createDirWatcherHandle = function(watchers) {
                return {
                    close: function() {
                        watchers.forEach(function(watcher) {
                            watcher.close();
                        });
                    }
                };
            };
        
        return {
            watchDir: function(dir, callback, thisObj, options) {
                var watchers = [];
                
                options = options || {};
                
                var filenameMatchers = [];
                
                if (options.filenamePatterns && options.filenamePatterns.length) {
                    var filenamePatterns = options.filenamePatterns.split(/\s*,\s*/);
                    filenameMatchers.push(createFilenameMatcherFromPatterns(filenamePatterns));
                }
                
                var dirModifiedFunc = function(file) {
                    
//                    for (var i=0, len=filenameMatchers.length, matcher; i<len; i++) {
//                        matcher = filenameMatchers[i];
//                        if (matcher(file.getName()) === false) {
//                            return false;
//                        }
//                    }
                };
                
                if (options.recursive) {
                    require('raptor/files/walker').walk(
                        dir, 
                        function(dir) {
                            watchers.push(this.watch(dir.getAbsolutePath(), dirModifiedFunc));
                        },
                        this,
                        {
                            dirsOnly: true
                        });
                }
                
                
                return createDirWatcherHandle(watchers);
            }
        };
    });
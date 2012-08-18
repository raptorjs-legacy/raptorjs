raptor.define(
    'hot-reloader',
    function(raptor) {
        "use strict";
        
        var fileWatcher = raptor.require('file-watcher'),
            nodeHotReloader = require('hot-reloader');

        var Watcher = function() {
            this._watchers = [];
        };
        
        Watcher.prototype = {
            _addWatcher: function(watcher) {
                this._watchers.push(watcher);
            },
            
            close: function() {
                raptor.forEach(this._watchers, function(watcher) {
                    watcher.close();
                }, this);
                this._watchers = [];
            }
        };
        
        
        return {
            watch: function(moduleName, callback, thisObj, options) {
                
                
                if (!options) {
                    options = {};
                }
                var watcher = new Watcher(),
                    _watchModule = function(moduleName) {
                        var originalModule = raptor.find(moduleName),
                            modified = function() {
                                raptor.uncache(moduleName);
                                var newModule = raptor.find(moduleName);
                                if (originalModule && newModule) {
                                    for (var k in newModule) {
                                        if (newModule.hasOwnProperty(k)) {
                                            originalModule[k] = newModule[k];
                                        }
                                    }
                                }
                                callback.call(thisObj, {
                                    watcher: watcher,
                                    moduleName: moduleName
                                });
                            };
                        
                        var manifest = raptor.require('oop').getModuleManifest(name);
                        manifest.forEachInclude({
                            callback: function(type, include) {
                                if (!include.isPackageInclude()) {
                                    
                                    var resource = include.getResource();
                                    if (resource && resource.exists() && resource.isFileResource()) {
                                        if (include.type === 'js') {
                                            watcher._addWatcher(nodeHotReloader.watch(resource.getSystemPath(), modified));
                                        }
                                        else {
                                            watcher._addWatcher(fileWatcher.watch(resource.getSystemPath(), modified));    
                                        }   
                                    }
                                }
                                
                            },
                            thisObj: this
                        });
                    };
                
                
                
                raptor.forEach(moduleName, _watchModule);
                
                return watcher;
            }
        };
    });
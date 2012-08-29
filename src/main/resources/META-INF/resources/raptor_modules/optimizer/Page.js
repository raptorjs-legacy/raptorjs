raptor.defineClass(
    'optimizer.Page',
    function(raptor) {
        "use strict";
        
        var files = raptor.require('files'),
            File = files.File;
        
        var Page = function(pageConfig, config) {
            pageConfig = pageConfig || {};

            this.packageManifest = null;
            this.name = null;
            this.bundleSetDef = null;
            this.config = config;
            this.enabledExtensions = null;
            this.viewFile = null;
            this.basePath = null;
            this.dir = null;
            this.watching = false;
            this.watchers = [];
            this.includeCache = {};
            
            raptor.require('listeners').makeObservable(this, Page.prototype, ["modified"]);
            
                
            raptor.extend(this, pageConfig);
            
            if (this.packageManifest) {
                var packageResource = this.packageManifest.getPackageResource();
                if (packageResource.isFileResource()) {
                    this.packageFile = packageResource.getFile();    
                }
            }
            
            this.name = this.name.replace(/\\/g, '/');
        };

        Page.prototype = {
                
            getIncludeCache: function() {
                return this.includeCache;
            },
            
            enableExtension: function(name) {
                if (!this.enabledExtensions) {
                    this.enabledExtensions = raptor.require('packager').createExtensionCollection();
                }
                this.enabledExtensions.add(name);
            },
            
            isWatching: function() {
                return this.watching === true;
            },
            
            getOutputFilename: function() {
                return this.getViewFile().getName();
            },
            
            watch: function() {
                if (this.isWatching()) {
                    return; //Nothing to do;
                }
                this.watching = true;
                
                this.doWatch();
            },
            
            doWatch: function() {
                
            },
            
            addWatcher: function(watcher) {
                this.watchers.push(watcher);
            },
            
            stopWatching: function() {
                raptor.forEach(this.watchers, function(watcher) {
                    watcher.close();
                });
                this.watchers = [];
                this.watching = false;
            },
            
            getDir: function() {
                return this.dir || (this.viewFile ? this.viewFile.getParentFile() : null);
            },
            
            getSimpleName: function() {
                var name = this.getName();
                var lastSlash = name.lastIndexOf('/');
                return lastSlash !== -1 ? name.substring(lastSlash+1) : name;
            },
            
            hasViewFile: function() {
                return this.viewFile != null;
            },
            
            getBasePath: function() {
                return this.basePath;
            },
            
            getName: function() {
                return this.name;
            },

            getPackageManifest: function() {                
                return this.packageManifest;
            },
            
            getViewFile: function() {
                return this.viewFile;
            },
            
            getBundleSetDef: function() {
                return this.bundleSetDef;
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            addBundleSetDef: function(bundleSetDef) {
                if (this.bundleSetDef) {
                    throw raptor.createError(new Error('Page "' + this.name + '" already has bundles defined"'));
                }
                this.bundleSetDef = bundleSetDef;
            },
            toString: function() {
                return "[Page name=" + this.name + "]";
            }
        };
        
        return Page;
    });

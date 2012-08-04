raptor.defineClass(
    'optimizer.OptimizerEngine',
    function(raptor) {
        var files = raptor.require('files'),
            File = files.File,
            fileWatcher = raptor.require('file-watcher'),
            listeners = raptor.require('listeners');
        
        var OptimizerEngine = function(config) {
            this.config = config;
            this.pageIncludeCache = {};
            this.writer = this.createWriter();
            this.watchers = [];
            listeners.makeObservable(this, OptimizerEngine.prototype, ['configReloaded', 'packageModified']);
            
            if (config.isWatchTemplatesEnabled()) {
                raptor.require('templating.compiler').enableWatching();
            }
            
            
            
            
            this._startWatching();
        };
        
        OptimizerEngine.prototype = {
            _startWatching: function() {
                var watchConfigs = this.config.getWatchConfigs();
                raptor.forEach(watchConfigs, function(watchConfig) {
                    if (watchConfig.type === 'dir') {
                        var watcher = raptor.require('file-watcher').watchDir(
                            watchConfig.path, 
                            function(eventArgs) {
                                var file = eventArgs.file;
                            }, 
                            this,
                            {
                                recursive: watchConfig.recursive === true
                            });
                        
                        this._addWatcher(watcher, 'dir');
                    }
                }, this);
            },
            
            getPage: function(name) {
                return this.config.getPage(name);
            },
            
            getConfig: function() {
                return this.config;
            },
            
            setConfig: function(config) {
                this.config = config;
            },
            
            reloadConfig: function(config) {
                this.closeWatchers();
                this.clearCaches();
                this.setConfig(config);
                
                this.publish("configReloaded", {
                    optimizer: this,
                    config: config
                });
                this.logger().info("Optimizer configuration reloaded");
            },
            
            _watchFile: function(path, category, callback) {
                var watchers = this.watchers;
                
                if (!watchers[path]) {
                    watchers[path] = true;
                    var watcher = fileWatcher.watch(path, callback, this);
                    this._addWatcher(watcher, category);
                }
            },
            
            _addWatcher: function(watcher, category) {
                var watchers = this.watchers;
                watchers.push(watcher);
                watchers['has' + category] = true;
            },
            
            clearCaches: function() {
                this.pageIncludeCache = {};
            },

            closeWatchers: function() {
                
                this.forEachPage(function(page) {
                    page.stopWatching();
                });
                
                this.watchers.forEach(function(w) {
                    if (w.close) {
                        w.close();    
                    }
                    else if (w.stopWatching) {
                        w.stopWatching();
                    }
                    
                });
                this.watchers.splice(0, this.watchers.length);
            },
            
            hasWatchers: function(category) {
                var watchers = this.watchers;
                return arguments.length === 1 ? watchers['has' + category] === true : watchers.length > 0;
            },
            
            createWriter: function() {
                var config = this.config,     
                    optimizer = raptor.require('optimizer'),
                    writer = optimizer.createPageDependenciesFileWriter({
                        checksumsEnabled: config.isChecksumsEnabled(),
                        scriptsOutputDir: config.getScriptsOutputDir(),
                        styleSheetsOutputDir: config.getStyleSheetsOutputDir(),
                        htmlOutputDir: config.getHtmlOutputDir(),
                        checksumLength: 8
                    });
                
                var urlBuilder = optimizer.createSimpleUrlBuilder({
                    scriptsDir: config.getScriptsOutputDir(),
                    styleSheetsDir: config.getStyleSheetsOutputDir(),
                    scriptsPrefix: config.getScriptsUrlPrefix(),
                    styleSheetsPrefix: config.getStyleSheetsUrlPrefix() 
                });
            
            
                
                writer.setUrlBuilder(urlBuilder);
                writer.context.raptorConfig = config.raptorConfigJSON;
                
                if (config.isMinifyJsEnabled()) {
                    writer.addFilter(raptor.require("optimizer.MinifyJSFilter"));
                }
                
                if (config.isWatchIncludesEnabled()) {
                    writer.subscribe('bundleWritten', function(eventArgs) {
                        var bundle = eventArgs.bundle,
                            outputPath = eventArgs.file.getAbsolutePath();
                        
                        if (!bundle.watching && bundle.sourceResource && !bundle.inPlaceDeployment) {
                            this._watchFile(bundle.sourceResource.getSystemPath(), 'includes', function() {
                                this.logger().info('Include modified: ' + bundle.sourceResource.getSystemPath());
                                try
                                {
                                    writer.rewriteBundle(outputPath, bundle);    
                                }
                                catch(e) {
                                    this.logger().error('Unable to rewrite include "' + bundle.sourceResource.getSystemPath() + '". Exception: ' + e, e);
                                }
                                
                            }, this);
                            
                            bundle.watching = true;
                        }
                        eventArgs = null;
                    }, this);
                }
                
                return writer;
            },
            
            getPageIncludes: function(page, options) {
                options = options || {};
                //TODO Use the enabled extensions and the page name as the cache key
                //var page = 
                //var lookupKey
                var pageName = page.getName();
                
                var htmlIncludesByLocation = this.pageIncludeCache[pageName];
                if (!htmlIncludesByLocation) {
                    htmlIncludesByLocation = this.pageIncludeCache[pageName] = this.buildPageIncludes(page, options);    
                }
                
                return htmlIncludesByLocation;
            },
            
            watchPackage: function(manifest) {
                this._watchFile(manifest.getSystemPath(), 'packages', function(eventArgs) {
                    this.logger().info('Package modified: ' + manifest.getSystemPath());
                    raptor.require('packager').removePackageManifestFromCache(manifest);
                    if (files.exists(manifest.getSystemPath())) {
                        this.publish('packageModified', {
                            optimizer: this,
                            packageManifest: manifest
                        });
                    }
                }, this);
            },
            
            buildPageIncludes: function(page, options) {
                var config = this.config,
                    optimizer = raptor.require('optimizer');
                
                var sourceUrlResolver = config.hasServerSourceMappings() ? function(path) {
                        return config.getUrlForSourceFile(path);
                    } : null;

                var bundleSetDef = page.getBundleSetDef(),
                    enabledExtensions = options.enabledExtensions || page.getEnabledExtensions(),
                    bundleSet = config.createBundleSet(bundleSetDef, enabledExtensions);
                
                var pageDependencies = optimizer.buildPageDependencies({
                    inPlaceDeploymentEnabled: config.isInPlaceDeploymentEnabled(),
                    bundlingEnabled: config.isBundlingEnabled(),
                    pageName: page.getName(),
                    packagePath: page.getPackagePath(),
                    bundleSet: bundleSet,
                    sourceUrlResolver: sourceUrlResolver,
                    enabledExtensions: enabledExtensions
                });
                
                if (config.isWatchPackagesEnabled()) {
                    pageDependencies.getPackageManifests().forEach(this.watchPackage, this);
                }
                
                this.logger().info('Writing bundles for page "' + page.getName() + '" to the following directories:\n   JavaScript: ' + config.getScriptsOutputDir() + '\n   CSS: ' + config.getStyleSheetsOutputDir());
                
                var pageOutputFile = this.getPageOutputFile(page);
                if (pageOutputFile) {
                    this.writer.getUrlBuilder().setBaseDir(pageOutputFile.getParent());    
                }
                else {
                    this.writer.getUrlBuilder().setBaseDir(null);
                }
                
                var htmlIncludesByLocation = this.writer.writePageDependencies(pageDependencies);
                this.logger().info('Bundles for page "' + page.getName() + '" written to disk\n');
                return htmlIncludesByLocation;
            },
            
            forEachPage: function(callback, thisObj) {
                this.config.forEachPage(callback, thisObj);
            },
            
            getPageOutputFile: function(page) {
                if (!this.config.isInjectHtmlIncludesEnabled()) {
                    return null;
                }
                var viewFile = page.getViewFile();
                if (this.config.isModifyPagesEnabled()) {
                    outputFile = viewFile;
                }
                else {
                    var outputPageDir = this.config.getPageOutputDir();
                    if (!outputPageDir) {
                        return null;
                    }
                    
                    if (page.getBasePath()) {
                        outputFile = new File(outputPageDir, page.getDir().getAbsolutePath().substring(page.getBasePath().length) + "/" + page.getOutputFilename());
                    }
                    else {
                        outputFile = new File(outputPageDir, page.getOutputFilename());    
                    }
                }
                return outputFile;
            },
            
            writeAllPages: function() {
                var config = this.config,
                    logger = this.logger(),
                    _this = this;
                
                this.forEachPage(function(page) {
                    
                    if (page.hasViewFile()) {
                        
                        
                        var outputFile = this.getPageOutputFile(page);
                        if (outputFile == null) {
                            raptor.throwError(new Error("Unable to write out page with dependencies. Output page directory (<output-page-dir>) is not set for configuration."));
                        }
                        
                        var writePage = function() {
                            var html = page.render({
                                optimizer: _this
                            });
                            
                            logger.info('Writing page "' + page.getName() + '" with injected dependencies to "' + outputFile + '"...');
                            outputFile.writeFully(html);
                        };
                        
                        if (config.isWatchPagesEnabled()) {
                            page.watch();
                            this._addWatcher(page, 'pages');
                            
                            page.subscribe("modified", function(eventArgs) {
                                var file = eventArgs ? eventArgs.file : null;
                                if (!file || file.exists()) {
                                    try
                                    {
                                        writePage();    
                                    }
                                    catch(e) {
                                        logger.warn("Unable to write modified page to disk. Exception: " + e, e);
                                    }
                                }
                                else {
                                    logger.info('Modified page no longer exists: ' + pagePath);
                                }    
                            });
                            
                        }
                        
                        writePage();
                    }
                }, this);
            },
            
            cleanDirs: function() {
                this.config.forEachCleanDir(function(dir) {
                    if (files.exists(dir)) {
                        this.logger().info("Cleaning directory: " + dir);
                        try {
                            files.remove(dir);    
                        }
                        catch(e) {
                            this.logger().warn("Unable to clean directory: " + dir, e);
                        }
                    }    
                }, this);
            }
        };
        
        return OptimizerEngine;
    });
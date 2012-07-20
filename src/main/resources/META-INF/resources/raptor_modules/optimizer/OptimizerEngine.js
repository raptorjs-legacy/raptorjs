raptor.defineClass(
    'optimizer.OptimizerEngine',
    function(raptor) {
        var files = raptor.require('files'),
            File = files.File,
            fileWatcher = raptor.require('file-watcher'),
            objects = raptor.require('objects'),
            listeners = raptor.require('listeners');
        
        var OptimizerEngine = function(config) {
            this.config = config;
            this.pageIncludeCache = {};
            this.writer = this.createWriter();
            this.watchers = [];
            listeners.makeObservable(this, OptimizerEngine.prototype, ['configReloaded', 'packageModified']);
        };
        
        OptimizerEngine.prototype = {
                
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
                    var watcher = fileWatcher.watch(path, callback, this);
                    watchers.push(watcher);
                    watchers[path] = true;
                    watchers['has' + category] = true;
                }
            },
            
            clearCaches: function() {
                this.pageIncludeCache = {};
            },

            closeWatchers: function() {
                
                this.watchers.forEach(function(w) {
                    w.close();
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
            
            getPageIncludes: function(pageName, options) {
                options = options || {};
                //TODO Use the enabled extensions and the page name as the cache key
                //var pageDef = 
                //var lookupKey
                
                var htmlIncludesByLocation = this.pageIncludeCache[pageName];
                if (!htmlIncludesByLocation) {
                    var pageDef = this.config.getPageDef(pageName);
                    htmlIncludesByLocation = this.pageIncludeCache[pageName] = this.buildPageIncludes(pageDef, options);    
                }
                
                return htmlIncludesByLocation;
            },
            
            watchPackage: function(manifest) {
                this._watchFile(manifest.getSystemPath(), 'packages', function(eventArgs) {
                    this.logger().info('Package modified: ' + manifest.getSystemPath());
                    if (files.exists(manifest.getSystemPath())) {
                        this.publish('packageModified', {
                            optimizer: this,
                            packageManifest: manifest
                        });
                    }
                }, this);
            },
            
            buildPageIncludes: function(pageDef, options) {
                var config = this.config,
                    optimizer = raptor.require('optimizer');
                
                var sourceUrlResolver = config.hasServerSourceMappings() ? function(path) {
                        return config.getUrlForSourceFile(path);
                    } : null;

                var bundleSetDef = pageDef.getBundleSetDef(),
                    enabledExtensions = options.enabledExtensions || pageDef.getEnabledExtensions(),
                    bundleSet = config.createBundleSet(bundleSetDef, enabledExtensions);
                
                var pageDependencies = optimizer.buildPageDependencies({
                    inPlaceDeploymentEnabled: config.isInPlaceDeploymentEnabled(),
                    bundlingEnabled: config.isBundlingEnabled(),
                    pageName: pageDef.getName(),
                    packagePath: pageDef.getPackagePath(),
                    bundleSet: bundleSet,
                    sourceUrlResolver: sourceUrlResolver,
                    enabledExtensions: enabledExtensions
                });
                
                if (config.isWatchPackagesEnabled()) {
                    pageDependencies.getPackageManifests().forEach(this.watchPackage, this);
                }
                
                this.logger().info('Writing bundles for page "' + pageDef.getName() + '" to the following directories:\n   JavaScript: ' + config.getScriptsOutputDir() + '\n   CSS: ' + config.getStyleSheetsOutputDir());
                
                var pageOutputFile = this.getPageOutputFile(pageDef);
                if (pageOutputFile) {
                    this.writer.getUrlBuilder().setBaseDir(pageOutputFile.getParent());    
                }
                else {
                    this.writer.getUrlBuilder().setBaseDir(null);
                }
                
                var htmlIncludesByLocation = this.writer.writePageDependencies(pageDependencies);
                this.logger().info('Bundles for page "' + pageDef.getName() + '" written to disk\n');
                return htmlIncludesByLocation;
            },
            
            forEachPage: function(callback, thisObj) {
                this.config.forEachPage(callback, thisObj);
            },
            
            getPageOutputFile: function(pageDef) {
                if (!this.config.isInjectHtmlIncludesEnabled()) {
                    return null;
                }
                var pagePath = pageDef.getHtmlPath();
                if (this.config.isModifyPagesEnabled()) {
                    outputFile = new File(pageDef.getHtmlPath());
                }
                else {
                    var outputPageDir = this.config.getPageOutputDir();
                    if (!outputPageDir) {
                        return null;
                    }
                    
                    if (pageDef.basePath) {
                        outputFile = new File(outputPageDir, pagePath.substring(pageDef.basePath.length));
                    }
                    else {
                        outputFile = new File(outputPageDir, new File(pageDef.getHtmlPath()).getName());    
                    }
                }
                return outputFile;
            },
            
            writeAllPages: function() {
                var HtmlInjector = raptor.require('optimizer.HtmlInjector'),
                    config = this.config,
                    logger = this.logger();
                
                this.forEachPage(function(pageDef) {
                    var pagePath = pageDef.getHtmlPath();
                    if (pagePath) {
                        var includes = this.getPageIncludes(pageDef.name);
                        if (config.isInjectHtmlIncludesEnabled()) {
                            
                            
                            var outputFile = this.getPageOutputFile(pageDef);
                            if (outputFile == null) {
                                raptor.throwError(new Error("Unable to write out page with dependencies. Output page directory (<output-page-dir>) is not set for configuration."));
                            }
                            
                            var injectPageDependencies = function() {
                                var pageHtml = files.readFully(pagePath);
                                var injector = new HtmlInjector(pageHtml, config.isKeepHtmlMarkersEnabled());
                                objects.forEachEntry(includes, function(location, includeHtml) {
                                    injector.inject(location, includeHtml);
                                });
                                
                                var outputPageHtml = injector.getHtml();
                                
                                logger.info('Writing page "' + pageDef.getName() + '" with injected dependencies to "' + outputFile + '"...');
                                outputFile.writeFully(outputPageHtml);    
                            };
                            
                            injectPageDependencies();
                            
                            if (config.isWatchPagesEnabled() && config.getPageOutputDir()) {
                                this._watchFile(pageDef.getHtmlPath(), 'pages', function(eventArgs) {
                                    logger.info('Page modified: ' + eventArgs.filename);
                                    if (files.exists(eventArgs.filename)) {
                                        injectPageDependencies();
                                    }
                                    else {
                                        logger.info('Modified page no longer exists: ' + pagePath);
                                        //rerun(); //The page might have been moved...
                                    }
                                    
                                }, this);
                            }
                            
                            
                        }
                        
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
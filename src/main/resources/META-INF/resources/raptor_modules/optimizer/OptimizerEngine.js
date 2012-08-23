raptor.defineClass(
    'optimizer.OptimizerEngine',
    function(raptor) {
        "use strict";
        
        var files = raptor.require('files'),
            File = files.File,
            fileWatcher = raptor.require('file-watcher'),
            listeners = raptor.require('listeners'),
            strings = raptor.require('strings');
        
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
            getParam: function(name) {
                return this.config.getParam(name);
            },
            
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
            
            getExtensionsKey: function(extensions) {
                if (!extensions || extensions.length === 0) {
                    return "";
                }
                return extensions.join("|");
            },
            
            getPageBundleSet: function(page, enabledExtensions) {
                
                var bundleSetDef = page.getBundleSetDef();
                enabledExtensions = enabledExtensions || page.getEnabledExtensions();
                
                var lookupKey = 'bundleSet-' + enabledExtensions.getKey();
                var bundleSet = bundleSetDef[lookupKey];
                if (!bundleSet) {
                    bundleSet = this.config.createBundleSet(bundleSetDef, enabledExtensions);
                    bundleSetDef[lookupKey] = bundleSet;
                }
                return bundleSet;
            },
            
            buildPageIncludes: function(page, options) {
                var config = this.config,
                    optimizer = raptor.require('optimizer');
                
                var sourceUrlResolver = config.hasServerSourceMappings() ? function(path) {
                        return config.getUrlForSourceFile(path);
                    } : null;

                var enabledExtensions = options.enabledExtensions || page.getEnabledExtensions(),
                    bundleSet = this.getPageBundleSet(page, enabledExtensions);
                    
                
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
            
            getPageRelativePath: function(page) {
                if (page.getBasePath()) {
                    if (strings.startsWith(page.getDir().getAbsolutePath(), page.getBasePath())) {
                        return page.getDir().getAbsolutePath().substring(page.getBasePath().length);    
                    }
                }
                
                return null;
            },
            
            getPageOutputFile: function(page) {
                var viewFile = page.getViewFile(),
                    outputFile;
                
                if (this.config.isModifyPagesEnabled()) {
                    outputFile = viewFile;
                }
                else {
                    var outputPageDir = this.config.getPageOutputDir();
                    if (!outputPageDir) {
                        return null;
                    }
                    var relPath = this.getPageRelativePath(page);
                    
                    if (relPath) {
                        outputFile = new File(outputPageDir, relPath + "/" + page.getOutputFilename());
                    }
                    else {
                        outputFile = new File(outputPageDir, page.getOutputFilename());    
                    }
                }
                return outputFile;
            },
            
            writePageIncludesHtml: function(page) {
                var config = this.config;
                var baseDir = config.getHtmlOutputDir(); 
                if (!baseDir) {
                    return;
                }
                
                var relPath = this.getPageRelativePath(page),
                    outputDir;
                
                if (relPath) {
                    outputDir = files.joinPaths(baseDir, relPath);
                }
                else {
                    outputDir = baseDir;
                }
                
                var includes = this.getPageIncludes(page);
                
                raptor.forEachEntry(includes, function(location, code) {
                    var outputFile;
                    
                    if (relPath) {
                        outputFile = new File(outputDir, "includes-" + location + ".html");
                    }
                    else {
                        outputFile = new File(outputDir, page.getSimpleName() + "-includes-" + location + ".html");
                    }
                    
                    this.logger().info('Writing page HTML includes for page "' + page.getName() + '" to "' + outputFile + '"...');
                    outputFile.writeFully(code);
                }, this);
            },
            
            writeAllPages: function() {
                var config = this.config,
                    logger = this.logger(),
                    _this = this;
                
                this.forEachPage(function(page) {
                    
                    if (page.hasViewFile()) {
                        
                        
                        var outputFile = this.getPageOutputFile(page);
                        if (outputFile == null) {
                            raptor.throwError(new Error("Unable to write out page with dependencies. Output page directory (<page-output-dir>) is not set for configuration."));
                        }
                        
                        var writePage = function() {
                            if (config.isWriteHtmlIncludesEnabled()) {
                                _this.writePageIncludesHtml(page);    
                            }
                            
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
                                    logger.info('Modified page no longer exists: ' + file.getAbsolutePath());
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
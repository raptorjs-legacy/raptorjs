raptor.defineClass(
    'optimizer.OptimizerEngine',
    function(raptor) {
        "use strict";
        
        var files = raptor.require('files'),
            File = files.File,
            fileWatcher = raptor.require('file-watcher'),
            listeners = raptor.require('listeners'),
            strings = raptor.require('strings'),
            packager = raptor.require('packager');
        
        var OptimizerEngine = function(config) {
            this.config = config;
            
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
            
            registerPage: function(pageConfig) {
                return this.config.registerPage(pageConfig);
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
                    writer = optimizer.createPageDependenciesFileWriter(config);
                
                var urlBuilder = optimizer.createSimpleUrlBuilder({
                    scriptsDir: config.getScriptsOutputDir(),
                    styleSheetsDir: config.getCssOutputDir(),
                    scriptsPrefix: config.getScriptsUrlPrefix(),
                    styleSheetsPrefix: config.getUrlPrefix() 
                });
            
            
                
                writer.setUrlBuilder(urlBuilder);
                writer.context.raptorConfig = config.raptorConfigJSON;
                
                if (config.isMinifyJsEnabled()) {
                    writer.addFilter(raptor.require("optimizer.MinifyJSFilter"));
                }
                
                raptor.forEach(config.getFilters(), function(filterDef) {
                    var Filter = raptor.require(filterDef.className);
                    if (Filter.filter) {
                        writer.addFilter(Filter);
                    }
                    else if (typeof Filter === 'function') {
                        if (Filter.prototype.filter) {
                            writer.addFilter(new Filter());
                        }
                        else {
                            writer.addFilter(Filter);
                        }
                    }
                    else {
                        throw raptor.createError(new Error('Invalid filter: ' + filterDef));
                    }
                });
                
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
            
            getPageHtmlBySlot: function(page, options) {
                if (typeof page === 'string') {
                    page = this.getPage(page);
                }
                
                options = options || {};

                
                var extensions;
                
                if (options.enabledExtensions) {
                    if (packager.isExtensionCollection(options.enabledExtensions)) {
                        extensions = options.enabledExtensions;
                    }
                    else {
                        extensions = packager.createExtensionCollection(options.enabledExtensions);
                    }
                }
                else {
                    extensions = page.getEnabledExtensions() || this.config.getEnabledExtensions();
                }
                
                var cacheKey = extensions.getKey();
                var pageHtmlCache = page.getPageHtmlCache();
                var pageHtmlBySlot = pageHtmlCache[cacheKey] || (pageHtmlCache[cacheKey] = this.buildPageHtmlBySlot(page, options));
                return pageHtmlBySlot;
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
            
            getPageBundleSet: function(page, enabledExtensions) {
                
                var bundleSetDef = page.getBundleSetDef() || this.config.getBundleSetDef("default");
                if (!bundleSetDef) {
                    bundleSetDef = this.config.addBundleSetDef({
                        name: "default"
                    });
                }
                enabledExtensions = enabledExtensions || page.getEnabledExtensions() || this.config.getEnabledExtensions();
                
                var cacheKey = enabledExtensions.getKey();
                var bundleSetCache = bundleSetDef.getBundleSetCache();
                
                var bundleSet = bundleSetCache[cacheKey];
                if (!bundleSet) {
                    bundleSet = this.config.createBundleSet(bundleSetDef, enabledExtensions);
                    bundleSetCache[cacheKey] = bundleSet;
                }
                return bundleSet;
            },
            
            buildPageDependencies: function(page, options) {
                
                var config = this.config;
            
                var sourceUrlResolver = config.hasServerSourceMappings() ? function(path) {
                    return config.getUrlForSourceFile(path);
                } : null;
                
                var enabledExtensions = options.enabledExtensions || page.getEnabledExtensions() || this.config.getEnabledExtensions(),
                    bundleSet = this.getPageBundleSet(page, enabledExtensions);
                    
                
                var pageDependencies = raptor.require('optimizer').createPageDependencies({
                    inPlaceDeploymentEnabled: config.isInPlaceDeploymentEnabled(),
                    bundlingEnabled: config.isBundlingEnabled(),
                    pageName: page.getName(),
                    packageManifest: page.getPackageManifest(),
                    bundleSet: bundleSet,
                    sourceUrlResolver: sourceUrlResolver,
                    enabledExtensions: enabledExtensions
                });
                
                return pageDependencies;
            },
            
            
            buildPageHtmlBySlot: function(page, options) {
                var config = this.config;

                var pageDependencies = this.buildPageDependencies(page, options);
                
                if (config.isWatchPackagesEnabled()) {
                    pageDependencies.getPackageManifests().forEach(this.watchPackage, this);
                }
                
                this.logger().info('Writing bundles for page "' + page.getName() + '" to the following directories:\n   JavaScript: ' + config.getScriptsOutputDir() + '\n   CSS: ' + config.getCssOutputDir());
                
                if (page.getOutputDir()) {
                    this.writer.getUrlBuilder().setBaseDir(page.getOutputDir().toString());
                }
                else {
                    var pageOutputFile = this.getPageOutputFile(page);
                    if (pageOutputFile) {
                        this.writer.getUrlBuilder().setBaseDir(pageOutputFile.getParent());    
                    }
                    else {
                        this.writer.getUrlBuilder().setBaseDir(null);
                    }
                }
                
                
                var pageHtmlBySlot = this.writer.writePageDependencies(pageDependencies);
                this.logger().info('Bundles for page "' + page.getName() + '" written to disk\n');
                return pageHtmlBySlot;
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
                    var outputPageDir = this.config.getRenderedPagesOutputDir();
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
            
            writePageSlotsHtml: function(page, options) {
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
                
                var pageHtmlBySlot = this.getPageHtmlBySlot(page, options);
                
                raptor.forEachEntry(pageHtmlBySlot, function(slot, code) {
                    var outputFile;
                    
                    if (relPath) {
                        outputFile = new File(outputDir, "includes-" + slot + ".html");
                    }
                    else {
                        outputFile = new File(outputDir, page.getSimpleName() + "-includes-" + slot + ".html");
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
                            throw raptor.createError(new Error("Unable to write out page with dependencies. Output page directory (<page-output-dir>) is not set for configuration."));
                        }
                        
                        var writePage = function() {
                            var html;
                            
                            if (config.isWritePageSlotsHtmlEnabled()) {
                                _this.writePageSlotsHtml(page);    
                            }
                            
                            if (config.isWriteRenderedPagesEnabled()) {
                                html = page.render({
                                    optimizer: _this
                                });
                                logger.info('Writing page "' + page.getName() + '" with injected dependencies to "' + outputFile + '"...');
                                outputFile.writeFully(html);
                            }
                            
                            
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
            },
            
            setOptimizerForContext: function(context, page) {
                raptor.require('optimizer').setOptimizerForContext(context, this);
                if (arguments.length === 2) {
                    raptor.require('optimizer').setPageForContext(context, page);    
                }
            }
        };
        
        return OptimizerEngine;
    });
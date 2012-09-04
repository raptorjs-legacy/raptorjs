raptor.define(
    "optimizer", 
    function(raptor) {
        "use strict";
        
        var forEach = raptor.forEach,
            File = raptor.require('files').File,
            packager = raptor.require('packager'),
            Bundle = raptor.require("optimizer.Bundle"),
            BundleSet = raptor.require("optimizer.BundleSet"),
            PageDependencies = raptor.require("optimizer.PageDependencies"),
            fileWatcher = raptor.require('file-watcher');
            
        return {
            
            
            createOptimizer: function(config, params) {
                if (typeof config === 'string') {
                    config = this.loadConfigXml(config, params);
                }
                
                var OptimizerEngine = raptor.require('optimizer.OptimizerEngine');
                var optimizerEngine = new OptimizerEngine(config);
                var logger = this.logger();
                
                if (config.isWatchConfigEnabled()) {
                    fileWatcher.watch(configXmlPath, function(eventArgs) {
                        logger.info("Optimizer configuration file modified: " + configXmlPath);
                        try
                        {
                            config = this.createConfig(configXmlPath, params);
                            if (!config.isWatchConfigEnabled()) {
                                eventArgs.closeWatcher();
                            }
                            optimizerEngine.reloadConfig(config);    
                        }
                        catch(e) {
                            logger.error('Unable to reload optimizier configuration file at path "' + configXmlPath + '". Exception: ' + e, e);
                        }
                        
                    }, this);
                }
                
                return optimizerEngine;
            },
            
            loadConfigXml: function(configFile, params) {
                if (typeof configFile === 'string') {
                    configFile = new File(configFile);
                }
                
                var Config = raptor.require('optimizer.Config');
                var configXml = configFile.readFully();
                var config = new Config(params);
                config.setConfigResource(raptor.require('resources').createFileResource(configFile));
                config.parseXml(configXml, configFile.getAbsolutePath());
                config.findPages();
                return config;
            },
            
            createPage: function(pageConfig) {
                var Page = raptor.require("optimizer.Page");
                return new Page(pageConfig);
            },
            
            createPageDependencies: function(config) {
                return new PageDependencies(config);
            },
            
            createBundle: function(name) {
                return new Bundle(name);
            },
            
            createBundleSet: function(bundles, options) {
                return new BundleSet(bundles, options);
            },
            
            createPageDependenciesFileWriter: function(config) {
                var PageDependenciesFileWriter = raptor.require("optimizer.PageDependenciesFileWriter");
                return new PageDependenciesFileWriter(config);
            },
            
            createSimpleUrlBuilder: function(config) {
                var SimpleUrlBuilder = raptor.require("optimizer.SimpleUrlBuilder");
                return new SimpleUrlBuilder(config);
            },
            
            
            
            forEachInclude: function(options) {
    
               
                var enabledExtensions = options.enabledExtensions, 
                    includeCallback = options.handleInclude,
                    packageCallback = options.handlePackage,
                    thisObj = options.thisObj;
    
    
                var foundIncludes = {};
                
                var handleManifest = function(manifest, parentPackage, recursive, depth, async) {
                    var foundKey = manifest.getKey() + "|" + async;
                    
                    var context = {
                            recursive: recursive === true, 
                            depth: depth, 
                            async: async === true,
                            parentPackage: parentPackage
                        };
                    
                    var recurseIntoPackage = packageCallback.call(thisObj, manifest, context);
                    if (recurseIntoPackage === false || foundIncludes[foundKey]) { //Avoid infinite loop by keeping track of which packages we have recursed into
                        return;
                    }    
                    
                    if (recursive === true || depth <= 0) {

                        manifest.forEachInclude(
                            function(type, packageInclude) {
                                
                                handleInclude.call(this, packageInclude, manifest, recursive, depth+1, async || packageInclude.isAsync());
                            },
                            this,
                            {
                                enabledExtensions: enabledExtensions
                            });
                    }

                };
                
                var handleInclude = function(include, parentPackage, recursive, depth, async) {
                    var foundKey = include.getKey() + "|" + async;
                    if (foundIncludes[foundKey]) {
                        return; //Include already handled
                    }
                    
                    foundIncludes[foundKey] = true;
                    
                    var context = {
                        recursive: recursive === true, 
                        depth: depth, 
                        async: async === true,
                        parentPackage: parentPackage
                    };
                    
                    if (include.isPackageInclude()) {
                        var dependencyManifest = include.getManifest();
                        
                        if (!dependencyManifest) {
                            throw raptor.createError(new Error("Dependency manifest not found for package include: " + include.toString()));
                        }
                        
                        handleManifest.call(this, dependencyManifest, parentPackage, recursive, depth, async);
                    }
                    else {
                        includeCallback.call(thisObj, include, context);
                    }
                };
                
                forEach(options.includes, function(include) {
                    include = packager.createInclude(include);
                    
                    handleInclude.call(
                        this, 
                        include, 
                        null,
                        options.recursive === true || include.recursive === true, 
                        0,
                        include.isAsync());
                    
                }, this);

                if (options.packages) {
                    forEach(options.packages, function(packageManifest) {
                        handleManifest.call(this, packageManifest, null, options.recursive === true, -1, false);
                    }, this);
                }
            }
        }; //end return
    });
raptor.define(
    "optimizer", 
    function(raptor) {
        "use strict";
        
        var forEach = raptor.forEach,
            packager = raptor.require('packager'),
            Bundle = raptor.require("optimizer.Bundle"),
            BundleSet = raptor.require("optimizer.BundleSet"),
            PageDependencies = raptor.require("optimizer.PageDependencies"),
            fileWatcher = raptor.require('file-watcher');
            
        return {
            createOptimizer: function(configXmlPath, params) {
                var config = this.createConfig(configXmlPath, params);
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
            
            createConfig: function(configXmlPath, params) {
                var Config = raptor.require('optimizer.Config');
                var configXml = raptor.require('files').readFully(configXmlPath);
                var config = new Config(params);
                config.parseXml(configXml, configXmlPath);
                config.findPages();
                return config;
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
            
            buildPageDependencies: function(config) {
                return new PageDependencies(config
                    );
            },
            
            forEachInclude: function(options) {
    
               
                var includes = options.includes, 
                    enabledExtensions = options.enabledExtensions, 
                    includeCallback = options.handleInclude,
                    packgeIncludeCallback = options.handlePackageInclude,
                    thisObj = options.thisObj;
    
    
                var foundIncludes = {};
                
                var handleInclude = function(include, recursive, depth, parentPackage, async) {

                    
                    
                    foundIncludes[include.getKey()] = true;
                    
                    var context = {
                        recursive: recursive === true, 
                        depth: depth, 
                        async: async === true,
                        parentPackage: parentPackage
                    };
                    
                    if (include.isPackageInclude()) {
                        
                        
                        var foundKey = include.getKey() + "|" + async;
                    
                        var recurseIntoPackage = packgeIncludeCallback.call(thisObj, include, context);
                        if (recurseIntoPackage === false || foundIncludes[foundKey]) { //Avoid infinit loop by keeping track of which packages we have recursed into
                            return;
                        }    
                        
                        var dependencyManifest = include.getManifest();
                        
                        if (!dependencyManifest) {
                            raptor.throwError(new Error("Dependency manifest not found for package include: " + include.toString()));
                        }
                        
                        if (recursive === true || depth === 0) {
                            
                            foundIncludes[foundKey] = true;
                            
                            dependencyManifest.forEachInclude(
                                function(type, packageInclude) {
                                    
                                    handleInclude.call(this, packageInclude, recursive, depth+1, dependencyManifest, async || packageInclude.isAsync());
                                },
                                this,
                                {
                                    enabledExtensions: enabledExtensions
                                });
                        }
                    }
                    else {
                        includeCallback.call(thisObj, include, context);
                    }
                };
                
                forEach(includes, function(include) {
                    include = packager.createInclude(include);
                    
                    handleInclude.call(
                        this, 
                        include, 
                        options.recursive === true || include.recursive === true, 
                        0, 
                        null,
                        include.isAsync());
                    
                }, this);
            }
        }; //end return
    });
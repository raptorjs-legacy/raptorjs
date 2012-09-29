raptor.define(
    "optimizer", 
    function(raptor) {
        "use strict";
        
        var forEach = raptor.forEach,
            File = raptor.require('files').File,
            packager = raptor.require('packager');
            
        return {
            pageOptimizer: null,
            
            configure: function(config, params) {
                var pageOptimizer = this.createPageOptimizer(config, params);
                this.pageOptimizer = pageOptimizer;
            },
            
            createPageOptimizer: function(config, params) {
                if (typeof config === 'string' || config instanceof File || raptor.require('resources.Resource')) {
                    config = this.loadConfigXml(config, params);
                }
                
                var PageOptimizer = raptor.require('optimizer.PageOptimizer');
                var pageOptimizer = new PageOptimizer(config);
                return pageOptimizer;
            },
            
            loadConfigXml: function(configFile, params) {
                var Config = raptor.require('optimizer.Config');
                var Resource = raptor.require('resources.Resource');
                
                var config = new Config(params);
                var configXml;
                
                if (typeof configFile === 'string') {
                    configFile = new File(configFile);
                }
                
                if (configFile instanceof File) {
                    configXml = configFile.readAsString("UTF-8");
                    config.setConfigResource(raptor.require('resources').createFileResource(configFile));
                }
                else if (configFile instanceof Resource) {
                    configXml = configFile.readAsString("UTF-8");
                    config.setConfigResource(configFile);
                }

                config.parseXml(configXml, configFile.getAbsolutePath());
                return config;
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
            },
            
            enableExtensionForContext: function(context, extension) {
                var extensions = context.getAttributes().optimizerExtensions;
                if (!extensions) {
                    extensions = packager.createExtensionCollection();
                }
                extensions.add(extension);
            },
            
            disableExtensionForContext: function(context, extension) {
                var extensions = context.getAttributes().optimizerExtensions;
                if (extensions) {
                    extensions.remove(extension);    
                }
                
            },
            
            getEnabledExtensionsForContext: function(context) {
                return context.getAttributes().optimizerExtensions;
            }
        }; //end return
    });
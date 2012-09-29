raptor.define(
    'templating.taglibs.optimizer.PageTag',
    function(raptor) {
        "use strict";
        var packager = raptor.require('packager'),
            resources = raptor.require('resources'),
            optimizer = raptor.require('optimizer');
        
        return {
            process: function(input, context) {
                
                
                var pageOptimizer = input.optimizer;
                
                if (!pageOptimizer) {
                    pageOptimizer = optimizer.pageOptimizer;
                }
                
                if (!pageOptimizer) {
                    throw raptor.createError(new Error('Page optimizer not configured for application. raptor.require("optimizer").configure(config) or provide an optimizer as input using the "optimizer" attribute.'));
                }
                
                var packagePath = input['package-path'];
                
                var basePath = input['base-path'];
                var enabledExtensions = input['enabled-extensions'];
                if (enabledExtensions) {
                    if (!packager.isExtensionCollection(enabledExtensions)) {
                        if (typeof enabledExtensions === 'string') {
                            enabledExtensions = enabledExtensions.split(/\s*,\s*/);
                        }
                        enabledExtensions = packager.createExtensionCollection(enabledExtensions);
                    }
                }
                
                var contextEnabledExtensions = optimizer.getEnabledExtensionsForContext(context);
                if (contextEnabledExtensions) {
                    if (!enabledExtensions) {
                        enabledExtensions = contextEnabledExtensions;
                    }
                    else {
                        enabledExtensions.addAll(contextEnabledExtensions);
                    }
                }
                
                var pageKey = packagePath ? 
                                (input.templatePath + "/" + packagePath + "/" + basePath) : 
                                input.templatePath + "/" + basePath;
                

                var cache = pageOptimizer.getCache(enabledExtensions);
                var optimizedPage = cache.getOptimizedPage(pageKey);
                
                if (!optimizedPage) {
                    var packageManifest = input['package-manifest'];
                    var packageResource = null;

                    if (packageManifest) {
                        var templateResource = resources.findResource(input.templatePath); //All paths will be resolved relative to this resource
                        packageManifest = packager.createPackageManifest(packageManifest, templateResource);
                    }
                    else if (packagePath) {
                        packageResource = resources.findResource(input.templatePath).resolve(packagePath);
                        
                        if (!packageResource.exists()) {
                            throw raptor.createError(new Error('Unable to configure page optimizer. The package resource at path "' + packageResource.getPath() + '" does not exist.'));
                        }    
                    }
                    
                    optimizedPage = pageOptimizer.optimizePage({
                        name: input.name,
                        basePath: basePath,
                        packageManifest: packageManifest,
                        packageResource: packageResource,
                        enabledExtensions: enabledExtensions
                    });
                    
                    cache.addOptimizedPage(pageKey, optimizedPage);
                }
                
                context.getAttributes().optimizedPage = optimizedPage; 
            }
        };
    });
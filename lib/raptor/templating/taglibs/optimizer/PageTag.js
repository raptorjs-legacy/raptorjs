define(
    'raptor/templating/taglibs/optimizer/PageTag',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        var packaging = require('raptor/packaging'),
            File = require('raptor/files/File'),
            resources = require('raptor/resources'),
            optimizer = require('raptor/optimizer');
        
        return {
            process: function(input, context) {
                
                
                var pageOptimizer = input.optimizer;
                
                if (!pageOptimizer) {
                    pageOptimizer = optimizer.pageOptimizer;
                }
                
                if (!pageOptimizer) {
                    throw raptor.createError(new Error('Page optimizer not configured for application. require("raptor/optimizer").configure(config) or provide an optimizer as input using the "optimizer" attribute.'));
                }
                
                var packagePath = input['package-path'];
                
                var basePath = input['base-path'];
                var enabledExtensions = input['enabled-extensions'];
                if (enabledExtensions) {
                    if (!packaging.isExtensionCollection(enabledExtensions)) {
                        if (typeof enabledExtensions === 'string') {
                            enabledExtensions = enabledExtensions.split(/\s*,\s*/);
                        }
                        enabledExtensions = packaging.createExtensionCollection(enabledExtensions);
                    }
                }
                
                if (basePath instanceof File) {
                    basePath = basePath.getAbsolutePath();
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
                        if (!templateResource || !templateResource.exists()) {
                            templateResource = resources.createFileResource(input.templatePath);
                        }
                        
                        if (!templateResource || !templateResource.exists()) {
                            throw raptor.createError(new Error('Invalid template resource path: ' + input.templatePath));
                        }
                        packageManifest = packaging.createPackageManifest(packageManifest, templateResource);
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
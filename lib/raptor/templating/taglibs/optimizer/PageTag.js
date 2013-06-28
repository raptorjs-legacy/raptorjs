define(
    'raptor/templating/taglibs/optimizer/PageTag',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        var packaging = require('raptor/packaging'),
            File = require('raptor/files/File'),
            resources = require('raptor/resources'),
            optimizer = require('raptor/optimizer'),
            packaging = require('raptor/packaging');
        
        function buildManifest(input, context) {
            var templateResource = resources.findResource(input.templatePath); //All paths will be resolved relative to this resource
            if (!templateResource || !templateResource.exists()) {
                templateResource = resources.createFileResource(input.templatePath);
            }

            if (input.packagePath) {
                var packageResource = templateResource.resolve(input.packagePath);
                        
                if (!packageResource.exists()) {
                    throw raptor.createError(new Error('Unable to configure page optimizer. The package resource at path "' + packageResource.getPath() + '" does not exist.'));
                }  

                return packaging.getPackageManifest(packageResource);
            }
            else {

                var packageManifest = packaging.createPackageManifest(null, templateResource);
                
                if (input.dependencies) {
                    packageManifest.setDependencies(input.dependencies);
                }
                else if (input.invokeBody) {
                    input.invokeBody(packageManifest);
                }

                return packageManifest;
            }
        }

        return {
            process: function(input, context) {
                var pageOptimizer = input.optimizer;

                
                
                if (!pageOptimizer) {
                    pageOptimizer = optimizer.pageOptimizer;
                }
                
                if (!pageOptimizer) {
                    throw raptor.createError(new Error('Page optimizer not configured for application. require("raptor/optimizer").configure(config) or provide an optimizer as input using the "optimizer" attribute.'));
                }
                
                var packageManifest = buildManifest(input, context);
                
                var basePath = input.basePath;
                var enabledExtensions = input.enabledExtensions;
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
                
                var cacheKey = input.cacheKey || input.name;
                var optimizerContext = context.getAttributes().optimizerContext || {};
                optimizerContext.renderContext = context;
                optimizerContext.enabledExtensions = enabledExtensions;

                var cache = pageOptimizer.getCache(optimizerContext);
                var optimizedPage = cache.getOptimizedPage(cacheKey);

                if (!optimizedPage) {

                    var optimizedPagePromise = pageOptimizer.optimizePage({
                        name: input.name,
                        basePath: basePath,
                        packageManifest: packageManifest,
                        enabledExtensions: enabledExtensions,
                        context: optimizerContext
                    });

                    optimizedPage = optimizedPagePromise;
                    
                    cache.addOptimizedPage(cacheKey, optimizedPagePromise);

                    optimizedPagePromise.then(function(optimizedPage) {
                        // Replace the promise with the optimized page when it is built
                        cache.addOptimizedPage(optimizedPage);
                    })
                }


                
                context.getAttributes().optimizedPage = optimizedPage;
            }
        };
    });
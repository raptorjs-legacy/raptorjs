raptor.define(
    'templating.taglibs.optimizer.PageTag',
    function(raptor) {
        "use strict";
        
        return {
            process: function(input, context) {
                
                
                var optimizer = raptor.require('optimizer'), 
                    optimizerEngine = input.optimizer;
                
                if (!optimizerEngine) {
                    optimizerEngine = optimizer.getOptimizerFromContext(context);
                }
                else {
                    optimizer.setOptimizerForContext(context, optimizerEngine);
                }
                
                if (!optimizerEngine) {
                    throw raptor.createError(new Error('Optimizer not set for request. An OptimizerEnginer instance can be associated with a request using the optimizerEngine.setOptimizerForContext(context) method.'));
                }
                
                var packagePath = input['package-path'];
                var packageManifest = input['package-manifest'];
                var outputDir = input['output-dir'];
                
                var pageKey = packagePath ? 
                                (input.templatePath + "/" + packagePath + "/" + outputDir) : 
                                input.templatePath + "/" + outputDir;
                
                var page = optimizerEngine.getPage(pageKey);
                if (!page) {
                    var packageResource = null;

                    if (packagePath) {
                        packageResource = raptor.require('resources').findResource(input.templatePath).resolve(packagePath);
                        
                        if (!packageResource.exists()) {
                            throw raptor.createError(new Error('Unable to configure page optimizer. The package resource at path "' + packageResource.getPath() + '" does not exist.'));
                        }    
                    }
                    else if (packageManifest) {
                        var templateResource = raptor.require('resources').findResource(input.templatePath); //All paths will be resolved relative to this resource
                        packageManifest = raptor.require('packager').createPackageManifest(templateResource, packageManifest);
                    }
                    
                    page = optimizerEngine.registerPage({
                        pageKey: pageKey,
                        name: input.name,
                        outputDir: outputDir,
                        packageResource: packageResource,
                        packageManifest: packageManifest
                    });
                }
                
                optimizer.setPageForContext(context, page);
                
            }
        };
    });
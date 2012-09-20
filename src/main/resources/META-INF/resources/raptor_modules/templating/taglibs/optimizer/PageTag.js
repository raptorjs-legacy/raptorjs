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
                
                var packagePath = input['package'];
                var basePath = input['base-path'];
                
                var pageKey = input.templatePath + "/" + packagePath + "/" + basePath;
                
                var page = optimizer.getPageFromContext(context);
                
                if (page) {
                    if (packagePath) {
                        page.setPackagePath(packagePath);
                    }
                }
                else {
                    page = optimizerEngine.getPage(pageKey);
                }
                
                if (!page) {
                    var packageResource = raptor.require('resources').findResource(input.templatePath).resolve(packagePath);
                    
                    if (!packageResource.exists()) {
                        throw raptor.createError(new Error('Unable to configure page optimizer. The package resource at path "' + packageResource.getPath() + '" does not exist.'));
                    }
                    
                    page = optimizerEngine.registerPage({
                        pageKey: pageKey,
                        name: input.name,
                        basePath: basePath,
                        packageResource: packageResource
                    });
                }
                
                optimizer.setPageForContext(context, page);
                
            }
        };
    });
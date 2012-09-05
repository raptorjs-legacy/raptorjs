raptor.define(
    'templating.taglibs.optimizer.PageTag',
    function(raptor) {
        
        return {
            process: function(input, context) {
                
                
                var optimizer = raptor.require('optimizer').getFromContext(context);
                if (!optimizer) {
                    throw raptor.createError(new Error('Optimizer not set for request. An OptimizerEnginer instance can be associated with a request using the optimizerEngine.configureForContext(context) method.'));
                }
                
                var packagePath = input['package'];
                
                var pageKey = input.templatePath + "/" + input['package'];
                
                var page = optimizer.getPage(pageKey);
                if (!page) {
                    var packageResource = raptor.require('resources').findResource(input.templatePath).resolve(packagePath);
                    
                    if (!packageResource.exists()) {
                        throw raptor.createError(new Error('Unable to configure page optimizer. The package resource at path "' + packageResource.getPath() + '" does not exist.'));
                    }
                    
                    page = optimizer.registerPage({
                        pageKey: pageKey,
                        name: input.name,
                        packageResource: packageResource
                    });
                }
                
                context.getAttributes().optimizerPage = page;
                
            }
        };
    });
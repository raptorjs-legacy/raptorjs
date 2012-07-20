var logger = raptor.require('logging').logger('express-raptor.middleware.page'),
    path = require('path');
    
module.exports = function(pagePath) {
    var pagesPath = this.pagesPath;
    var rootDir = this.root;
    var optimizer = this.optimizer;
    var watch = this.watch;
    var watchers = this.watchers;
    
    var controllerModuleName = path.join(rootDir, pagesPath, pagePath) + ".js";
    var controller = require(controllerModuleName).controller;
    
    if (watch === true) {
        var watcher = require('hot-reloader').watch(
                require, 
                controllerModuleName,
                function(name, newModule, oldModule) {
                    controller = newModule.controller;
                    logger.info('Reloading page controller at path "' + controllerModuleName + '"...');
                });
        watchers.push(watcher);
    }
    
    
    var templatePath = path.join(rootDir, pagesPath, pagePath) + ".rhtml";
    var templateResource = raptor.require('resources').createFileResource(templatePath);
    raptor.require('templating.compiler').compileAndLoadResource(templateResource, {templateName: templatePath});
    
    
    
    return function(req, res, next) {        
        try
        {
            var viewModel = controller(req, res, next);
            if (viewModel) {
                var includes = optimizer.getPageIncludes(pagePath);
                var _wrappedIncludes = includes._wrapped;
                if (!_wrappedIncludes) {
                    /*
                     * We wrap the includes in an object so that the HTML will not be automatically escaped
                     */
                    _wrappedIncludes = includes._wrapped = {};
                    raptor.forEachEntry(includes, function(location, html) {
                        _wrappedIncludes[location] = {toString: function() { return html; }};
                    });
                }
                viewModel.includes = _wrappedIncludes;
                var html = raptor.require('templating').renderToString(templatePath, viewModel);
                res.send(html);
            }
        }
        catch(e) {
            logger.error('An error occurred while handling request with URL "' + req.url + '". Exception: ' + e, e); //TODO Provide better error handling
        }
        
    };
}
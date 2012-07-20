var templating = raptor.require('templating'),
    logger = raptor.require('logging').logger('express-raptor'),
    path = require('path');

var proto = {
    page: function(pagePath) {
        var pagesPath = this.pagesPath;
        var rootDir = this.root;
        var optimizer = this.optimizer;
        var watch = this.watch;
        var watchers = this.watchers;
        
        var controllerModuleName = path.join(rootDir, pagesPath, pagePath) + ".js";
        var controller = require(controllerModuleName).controller;
        
        if (watch === true) {
            var watcher = require('raptor').watchNodeModule(
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
        
        
        
        return function(req, res) {
            var context = {
                request: req,
                response: res
            };
            
            try
            {
                var viewModel = controller(context);
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
            catch(e) {
                logger.error('An error occurred while handling request with URL "' + req.url + '". Exception: ' + e, e); //TODO Provide better error handling
            }
            
        };
    }
};

exports.createServer = function(options) {
    
    
    options = options || {};
    
    if (options.watch === true) {
        raptor.require('templating.compiler').enableWatching();    
    }
    
    var rootDir = options.root;
    if (!rootDir) {
        throw new Error('The "root" property is required. This should be the file path of the root of the web application');
    }
    
    var routes = options.routes;
    if (!routes) {
        throw new Error('The "routes" property is required. This should be the file path of the routes');
    }
    routes = path.resolve(rootDir, routes);
    
    var optimizerConfig = options.optimizer;
    if (!optimizerConfig) {
        optimizerConfig = {};        
    }
    
    var profile = optimizerConfig.profile;
    if (!profile) {
        optimizerConfig.profile = process.env.NODE_ENV || 'development';
    }
    
    var optimizer = raptor.require('optimizer').createOptimizer(path.join(rootDir, 'optimizer-config.xml'), optimizerConfig);
    
    var logger = raptor.require('logging').logger('express-raptor');

    var express = require('express');

    var app = express.createServer();
    app.use(app.router); //This is the default router... have to add it now so that it will be part of the original stack
    var originalRoutes = raptor.extend({}, app.routes);
    var originalStack = [].concat(app.stack);
    

    
    app.raptor = {
        root: rootDir,
        optimizer: optimizer,
        pagesPath: options.pagesPath || '/pages',
        watch: options.watch === true,
        watchers: [],
        closeWatchers: function() {
            this.watchers.forEach(function(w) {
                w.close();
            });
            this.watchers = [];
        }
    };
    
    raptor.forEachEntry(proto, function(k, v) {
        app.raptor[k] = v;
    });
    
    require(routes)(app);
    
    
    raptor.require('file-watcher').watch(require.resolve(routes), function() {
        var k;
        
        logger.info("Server routes modified. Reloading routes...");
        
        //Clear out the existing routes
        for (k in app.routes) {
            delete app.routes[k];
        }
        
        //Add back the original routes
        for (k in originalRoutes) {
            app.routes[k] = originalRoutes[k];
        }
        
        //Clear the existing stack
        app.stack.splice(0, app.stack.length);
        
        //Add back the original stack
        originalStack.forEach(function(o) {
            app.stack.push(o);
        });

        delete require.cache[require.resolve(routes)];
        app.raptor.closeWatchers();
        require(routes)(app); 
        
        logger.info("Routes reloaded");

    });
    
    return app;
};


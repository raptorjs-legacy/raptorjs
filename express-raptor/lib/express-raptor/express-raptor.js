var templating = raptor.require('templating'),
    logger = raptor.require('logging').logger('express-raptor'),
    path = require('path');

exports.page = require('./middleware/page.js');

exports.getOptimizer = function(req) {
    return req.app.raptor.optimizer;
};

exports.createServer = function(options) {
    
    
    options = options || {};
    
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
    
//    var profile = optimizerConfig.profile;
//    if (!profile) {
//        optimizerConfig.profile = process.env.NODE_ENV || 'development';
//    }
//    
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
    

    require(routes)(app);
    
    if (options.watch === true) {
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
    }
    
    return app;
};


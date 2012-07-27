var logger = raptor.require('logging').logger('express-raptor.middleware.page'),
    path = require('path');

var expressRaptor = require('express-raptor');
    
module.exports = function(pagePath) {
    
    var page;
    
    return function(req, res, next) {        
        try
        {
            var optimizer = expressRaptor.getOptimizer(req);
            
            if (!page) {
                page = optimizer.getConfig().getPage(pagePath);
                if (optimizer.getConfig().isWatchPagesEnabled()) {
                    page.watch();
                }
            } 
            
            var html = page.render({
                optimizer: optimizer,
                request: req,
                response: res,
                next: next
            });
            
            res.send(html);
        }
        catch(e) {
            logger.error('An error occurred while handling request with URL "' + req.url + '". Exception: ' + e, e); //TODO Provide better error handling
        }
        
    };
}
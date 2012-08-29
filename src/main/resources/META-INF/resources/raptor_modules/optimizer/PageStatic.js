raptor.defineClass(
    'optimizer.PageStatic',
    'optimizer.Page',
    function(raptor) {
        "use strict";
        
        var fileWatcher = raptor.require('file-watcher');
        
        var PageStatic = function() {
            PageStatic.superclass.constructor.apply(this, arguments);
        };
        
        PageStatic.prototype = {
            doWatch: function() {
                var logger = this.logger();
                
                if (this.getViewFile() && this.getViewFile().exists()) {
                    this.addWatcher(fileWatcher.watch(this.getViewFile().getAbsolutePath(), function(eventArgs) {
                        var file = this.getViewFile();
                        logger.info('Page HTML file modified: ' + file.getAbsolutePath());
                        this.publish("modified", {
                            page: this,
                            file: file
                        });
                    }, this));
                }
            },
            
            render: function(context) {
                var optimizer = context.optimizer;
                var includes = optimizer.getPageIncludes(this);
                
                var config = this.config,
                    HtmlInjector = raptor.require('optimizer.HtmlInjector');
                
                var pageHtml = this.getViewFile().readFully();
                var injector = new HtmlInjector(pageHtml, config.isKeepHtmlMarkersEnabled());
                raptor.forEachEntry(includes, function(location, includeHtml) {
                    injector.inject(location, includeHtml);
                });
                return injector.getHtml();
            }
        };
        
        return PageStatic;
    });
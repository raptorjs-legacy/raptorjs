raptor.defineClass(
    'optimizer.PageRhtml',
    'optimizer.Page',
    function(raptor) {
        
        var fileWatcher = raptor.require('file-watcher'),
            files = raptor.require('files'),
            File = files.File;
        
        var PageHtml = function() {
            PageHtml.superclass.constructor.apply(this, arguments);
            
            this.templateLoaded = false;
            
            var controllerFile = new File(this.getDir(), this.getSimpleName() + ".js");
            
            
            if (controllerFile.exists()) {
                this.controllerFile = controllerFile;
                var controllerModule = require(controllerFile.getAbsolutePath());
                this.controller = controllerModule.controller;
            }
            
        };
        
        PageHtml.prototype = {
            getViewModel: function() {
                
                if (this.controller) {
                    return this.controller({
                        page: this
                    });
                }
                
                return null;
            },
            
            getOutputFilename: function() {
                return this.getSimpleName() + ".html";
            },
            
            doWatch: function() {
                var controllerFile = this.controllerFile,
                    _this = this,
                    logger = this.logger();
                
                if (controllerFile && controllerFile.exists()) {
                    this.addWatcher(require('hot-reloader').watch(
                        require, 
                        controllerFile.getAbsolutePath(),
                        function(name, newModule, oldModule) {
                            logger.info('Reloaded page controller at path "' + controllerFile.getAbsolutePath() + '"...');
                            _this.controller = newModule.controller;
                            _this.publish("modified");
                        }));
                }
                
                
                if (this.getViewFile() && this.getViewFile().exists()) {
                    this.addWatcher(fileWatcher.watch(this.getViewFile().getAbsolutePath(), function(eventArgs) {
                        var file = this.getViewFile();
                        this.templateLoaded = false; //Reload the view template
                        logger.info('Page template modified: ' + file.getAbsolutePath());
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
                
                if (!includes._wrapped) {
                    /*
                     * We wrap the includes in an object so that the HTML will not be automatically escaped
                     */
                    includes._wrapped = {};
                    raptor.forEachEntry(includes, function(location, html) {
                        includes._wrapped[location] = {toString: function() { return html; }};
                    });
                }
                includes = includes._wrapped;
                
                
                var templatePath = this.getViewFile().getAbsolutePath();
                if (!this.templateLoaded) {
                    this.templateLoaded = true;
                    var templateResource = raptor.require('resources').createFileResource(templatePath);
                    raptor.require('templating.compiler').compileAndLoadResource(templateResource, {templateName: templatePath});    
                }
                
                var viewModel = this.getViewModel() || {};
                viewModel.includes = includes;
                
                var html = raptor.require('templating').renderToString(templatePath, viewModel);
                return html;
            }
        };
        
        return PageHtml;
    });
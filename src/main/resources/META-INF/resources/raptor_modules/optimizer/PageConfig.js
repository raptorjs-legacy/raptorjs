raptor.defineClass(
    'optimizer.PageConfig',
    function(raptor) {
        var PageConfig = function() {
            this.includes = [];
            this.name = null;
            this.bundleSetDef = null;
            this.enabledExtensions = null;
            this.htmlPath = null;
        };

        PageConfig.prototype = {
            enableExtension: function(name) {
                if (!this.enabledExtensions) {
                    this.enabledExtensions = {};
                }
                this.enabledExtensions[name] = true;
                
            },
            
            getHtmlPath: function() {
                return this.htmlPath;
            },
            
            addInclude: function(include) {
                this.includes.push(include);
            },
            
            getBundleSetDef: function() {
                return this.bundleSetDef || this.config.getBundleSetDef("default");
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions ? Object.keys(this.enabledExtensions) : this.config.getEnabledExtensions();
            },
            
            addBundleSetDef: function(bundleSetDef) {
                if (this.bundleSetDef) {
                    raptor.throwError(new Error('Page "' + this.name + '" already has bundles defined"'));
                }
                this.bundleSetDef = bundleSetDef;
            },
            toString: function() {
                return "[PageConfig name=" + this.name + "]";
            }
        };
        
        return PageConfig;
    });

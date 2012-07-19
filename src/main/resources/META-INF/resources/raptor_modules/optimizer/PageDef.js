raptor.defineClass(
    'optimizer.PageDef',
    function(raptor) {
        var PageDef = function() {
            this.includes = [];
            this.name = null;
            this.bundleSetDef = null;
            this.config = null;
            this.enabledExtensions = null;
            this.htmlPath = null;
            this.packagePath = null;
        };

        PageDef.prototype = {
            enableExtension: function(name) {
                if (!this.enabledExtensions) {
                    this.enabledExtensions = {};
                }
                this.enabledExtensions[name] = true;
                
            },
            
            getName: function() {
                return this.name;
            },
            
            getPackagePath: function() {
                return this.packagePath;
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
                return "[PageDef name=" + this.name + "]";
            }
        };
        
        return PageDef;
    });

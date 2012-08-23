raptor.defineClass(
    'optimizer.PageConfig',
    function(raptor) {
        "use strict";
        
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
                    this.enabledExtensions = raptor.require('packager').createExtensionCollection();
                }
                this.enabledExtensions.add(name);
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
                return this.enabledExtensions || this.config.getEnabledExtensions();
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

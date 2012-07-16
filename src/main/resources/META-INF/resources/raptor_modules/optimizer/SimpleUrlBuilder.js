raptor.defineClass(
    "optimizer.SimpleUrlBuilder",
    function(raptor) {
        "use strict";
        
        var SimpleUrlBuilder = function(config) {
            this.prefix = config.prefix;
            this.scriptsPrefix = config.scriptsPrefix;
            this.styleSheetsPrefix = config.styleSheetsPrefix;
            this.scriptsDir = config.scriptsDir;
            this.styleSheetsDir = config.styleSheetsDir;
            this.pageDir = null;
        };
        
        SimpleUrlBuilder.prototype = {
            buildBundleUrl: function(bundle, checksum) {
                if (bundle.inPlaceDeployment === true && bundle.sourceResource) {
                    return require('path').relative(this.pageDir, bundle.sourceResource.getSystemPath());
                }
                
                return this.getPrefix(bundle) + this.getBundleFilename(bundle, checksum);
            },
            
            getBundleFilename: function(bundle, checksum) {
                return bundle.getName().replace(/[^A-Za-z0-9_\-\.]/g, '_') + (bundle.getLocation() && bundle.includeLocationInUrl !== false ? "-" + bundle.getLocation() : "") + (checksum ? "-" + checksum : "") + "." + this.getFileExtension(bundle.getContentType());
            },
            
            getFileExtension: function(contentType) {
                if (contentType === 'application/javascript') {
                    return 'js';
                }
                else if (contentType === 'text/css') {
                    return 'css';
                }
                else {
                    raptor.throwError(new Error("Unsupported content type: " + contentType));
                    return null;
                }
            },
            
            getPrefix: function(bundle) {
                var prefix;
                
                if (bundle.isJavaScript()) {
                    prefix = this.scriptsPrefix || this.prefix;
                }
                else if (bundle.isStyleSheet()) {
                    prefix = this.styleSheetsPrefix || this.prefix;
                }
                else {
                    raptor.throwError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                }
                
                if (!prefix) {
                    var toPath,
                        fromPath;
                    
                    if (bundle.isJavaScript()) {
                        toPath = this.scriptsDir;
                    }
                    else if (bundle.isStyleSheet()) {
                        toPath = this.styleSheetsDir;
                    }
                    else {
                        raptor.throwError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                    }
                    
                    fromPath = this.pageDir;
                    
                    prefix = require('path').relative(fromPath, toPath) + '/';
                }
                return prefix;
            }
        };

        
        return SimpleUrlBuilder;
    });
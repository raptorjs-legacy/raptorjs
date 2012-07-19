raptor.defineClass(
    "optimizer.SimpleUrlBuilder",
    function(raptor) {
        "use strict";
        
        var strings = raptor.require('strings');
        
        var SimpleUrlBuilder = function(config) {
            this.prefix = config.prefix;
            this.scriptsPrefix = config.scriptsPrefix;
            this.styleSheetsPrefix = config.styleSheetsPrefix;
            this.scriptsDir = config.scriptsDir;
            this.styleSheetsDir = config.styleSheetsDir;
            this.basePath = null;
        };
        
        SimpleUrlBuilder.prototype = {
            buildBundleUrl: function(bundle, checksum) {
                if (bundle.url) {
                    return bundle.url;
                }
                else if (bundle.inPlaceDeployment === true && bundle.sourceResource) {
                    return require('path').relative(this.basePath, bundle.sourceResource.getSystemPath());
                }
                
                return this.getPrefix(bundle) + this.getBundleFilename(bundle, checksum);
            },
            
            
            
            getBundleFilename: function(bundle, checksum) {
                var filename = bundle.getName().replace(/^\//, '').replace(/[^A-Za-z0-9_\-\.]/g, '_') + (bundle.getLocation() && bundle.includeLocationInUrl !== false ? "-" + bundle.getLocation() : "") + (checksum ? "-" + checksum : "");
                var ext = "." + this.getFileExtension(bundle.getContentType());
                if (!strings.endsWith(filename, ext)) {
                    filename += ext;
                }
                return filename;
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
                    
                    if (this.basePath) {
                        if (bundle.isJavaScript()) {
                            toPath = this.scriptsDir;
                        }
                        else if (bundle.isStyleSheet()) {
                            toPath = this.styleSheetsDir;
                        }
                        else {
                            raptor.throwError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                        }
                        
                        fromPath = this.basePath;
                        
                        prefix = require('path').relative(fromPath, toPath) + '/';
                    }
                }
                return prefix;
            }
        };

        
        return SimpleUrlBuilder;
    });
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
            this.baseDir = null;
        };
        
        SimpleUrlBuilder.prototype = {
            buildBundleUrl: function(bundle) {
                if (bundle.url) {
                    return bundle.url;
                }
                else if (bundle.inPlaceDeployment === true && bundle.sourceResource) {
                    return require('path').relative(this.baseDir, bundle.sourceResource.getSystemPath());
                }
                
                return this.getPrefix(bundle) + this.getBundleFilename(bundle);
            },
            
            setBaseDir: function(baseDir) {
                this.baseDir = baseDir;
            },
            
            
            getBundleFilename: function(bundle) {
                var checksum = bundle.getChecksum();
                
                var filename = bundle.getName().replace(/^\//, '').replace(/[^A-Za-z0-9_\-\.]/g, '-') + (bundle.getLocation() && bundle.includeLocationInUrl !== false ? "-" + bundle.getLocation() : "") + (checksum ? "-" + checksum : "");
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
                    throw raptor.createError(new Error("Unsupported content type: " + contentType));
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
                    throw raptor.createError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                }
                
                
                if (!prefix) {
                    var toPath,
                        fromPath;
                    
                    if (this.baseDir) {
                        if (bundle.isJavaScript()) {
                            toPath = this.scriptsDir;
                        }
                        else if (bundle.isStyleSheet()) {
                            toPath = this.styleSheetsDir;
                        }
                        else {
                            throw raptor.createError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                        }
                        
                        fromPath = this.baseDir;
                        
                        prefix = require('path').relative(fromPath, toPath) + '/';
                    }
                    else {
                        prefix = "";
                        //throw raptor.createError(new Error('Neither a URL prefix or base directory is set. Unable to calculate prefix for bundle URL.'));
                    }
                }
                
                
                return prefix;
            }
        };

        
        return SimpleUrlBuilder;
    });
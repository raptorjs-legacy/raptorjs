raptor.defineClass(
    "optimizer.SimpleUrlBuilder",
    function(raptor) {
        "use strict";
        
        var strings = raptor.require('strings');
        
        var SimpleUrlBuilder = function(config) {
            this.prefix = config.prefix;
            this.scriptsPrefix = config.scriptsPrefix;
            this.styleSheetsPrefix = config.styleSheetsPrefix;
            this.resourcesDir = config.resourcesDir;
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
                
                return this.getPrefix(bundle.getContentType()) + this.getBundleFilename(bundle);
            },
            
            setBaseDir: function(baseDir) {
                this.baseDir = baseDir;
            },
            
            buildResourceUrl: function(filename, contentType) {
                return filename;
            },
            
            getBundleFilename: function(bundle) {
                var checksum = bundle.getChecksum();
                
                var filename = bundle.getName().replace(/^\//, '').replace(/[^A-Za-z0-9_\-\.]/g, '-') + (bundle.getSlot() && bundle.includeSlotInUrl !== false ? "-" + bundle.getSlot() : "") + (checksum ? "-" + checksum : "");
                var ext = "." + this.getFileExtension(bundle.getContentType());
                if (!strings.endsWith(filename, ext)) {
                    filename += ext;
                }
                return filename;
            },
            
            getFileExtension: function(contentType) {
                return raptor.require('mime').extension(contentType);
            },
            
            getPrefix: function(contentType) {
                var prefix,
                    isStyleSheet = contentType === 'text/css',
                    isJavaScript = contentType === 'application/javascript';
                
                if (isJavaScript) {
                    prefix = this.scriptsPrefix || this.prefix;
                }
                else if (isStyleSheet) {
                    prefix = this.styleSheetsPrefix || this.prefix;
                }
                else {
                    prefix = this.prefix;
                }
                
                if (!prefix) {
                    var toPath,
                        fromPath;
                    
                    if (this.baseDir) {
                        if (isJavaScript) {
                            toPath = this.scriptsDir;
                        }
                        else if (isStyleSheet) {
                            toPath = this.styleSheetsDir;
                        }
                        else {
                            toPath = this.resourcesDir;
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
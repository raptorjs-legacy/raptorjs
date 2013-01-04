define(
    "raptor/optimizer/BundleUrlBuilder",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var strings = require('raptor/strings');
        
        var BundleUrlBuilder = function(urlPrefix, outputDir, config) {
            this.urlPrefix = urlPrefix;
            this.outputDir = outputDir;
            this.config = config;
        };
        
        BundleUrlBuilder.prototype = {
            /**
             * Builds a URL that points to a bundle 
             * 
             * @param bundle {optimizer.Bundle} The output bundle to generate a URL to
             * @param basePath The base path is only if using relative paths. The base path will vary by output page
             * 
             * @returns {String} The generated URL
             */
            buildBundleUrl: function(bundle, basePath) {
                if (bundle.url) {
                    return bundle.url;
                }
                else if (bundle.inPlaceDeployment === true && bundle.sourceResource) {

                    var url = this.config.getUrlForSourceFile(bundle.sourceResource.getSystemPath());
                    if (url === null) {
                        if (!basePath) {
                            throw raptor.createError(new Error("A base path is required for in-place deployment unless applicable source-mapping elements are found for all source files"));
                        }
                        return require('path').relative(basePath, bundle.sourceResource.getSystemPath());
                    }
                    return url;
                }
                
                return this.getPrefix(basePath) + this.getBundleFilename(bundle);
            },
            
            buildResourceUrl: function(filename, basePath) {
                return this.getPrefix(basePath) + filename;
            },

            /**
             * Generates the output filename for a bundle.
             * 
             * This method handles adding a checksum (if that option is enabled)
             * 
             * @param bundle {optimizer.Bundle} The output bundle
             * 
             * @returns {String} The generated filename
             */
            getBundleFilename: function(bundle) {
                var checksum = bundle.getChecksum();
                
                var filename = bundle.getName().replace(/^\//, '').replace(/[^A-Za-z0-9_\-\.]/g, '-') + (checksum ? "-" + checksum : "");
                var ext = "." + this.getFileExtension(bundle);
                if (!strings.endsWith(filename, ext)) {
                    filename += ext;
                }
                return filename;
            },
            
            /**
             * Returns the file extension to use for a bundle.
             * 
             * Internally this method uses a mime lookup module and uses the content type of the bundle to lookup the extension
             * 
             * @param bundle {optimizer.Bundle}
             * @returns {String} The file extension to use.
             */
            getFileExtension: function(bundle) {
                return require('raptor/mime').extension(bundle.getContentType());
            },
            
            /**
             * Returns the prefix that should be added to the bundle name.
             * 
             * If a URL prefix is not configured then a relative path will be
             * generated based on the output directory of the bundle
             * and the provided base path
             * 
             * @param basePath {String} The base path to use for generating a relative path to the output directory of the bundle. This argument is only required if a URL prefix is not configured.
             * @returns
             */
            getPrefix: function(basePath) {
                var prefix = this.urlPrefix;


                if (!prefix) {
                    if (basePath) {
                        
                        var toPath = this.outputDir.toString();

                        var fromPath = basePath.toString();
                        prefix = require('path').relative(fromPath, toPath) + '/';

                        if (prefix === '/') {
                            prefix = './';
                        }
                    }
                    else {
                        prefix = "/static/";
                    }
                }
                
                return prefix;
            }
        };

        
        return BundleUrlBuilder;
    });
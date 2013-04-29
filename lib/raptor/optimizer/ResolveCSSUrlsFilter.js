define(
    'raptor/optimizer/ResolveCSSUrlsFilter',
    function(require, exports, module) {
        "use strict";
        
        var logger = module.logger(),
            cssParser = require('raptor/css-parser'),
            strings = require('raptor/strings'),
            resources = require('raptor/resources'),
            promises = require('raptor/promises'),
            mime = require('raptor/mime');
        
        return {
            filter: function(code, contentType, context) {
                if (contentType === 'text/css') {
                    var output = cssParser.replaceUrls(code, function(url) {

                        if (strings.startsWith(url, "http://") ||
                            strings.startsWith(url, "https://") ||
                            strings.startsWith(url, "//")) {
                            return url;
                        }
                        var inputUrl = url;

                        var queryString = '',
                            queryStart = url.indexOf('?');

                        if (queryStart != -1) {
                            queryString = url.substring(queryStart);
                            url = url.substring(0, queryStart);
                        }

                        var dependency = context.dependency;
                        var bundle = context.bundle;


                        var resource = dependency && resources.resolveResource(dependency.getResource(), url);
                        if (resource && resource.isFileResource() && resource.exists()) {

                            
                            var config = context.config;

                            if (bundle && config.isInPlaceDeploymentEnabled()) {

                                var outputDir = context.writer.getOutputDir();
                                // This code block is for in-place deployment.
                                // If we are outputting the CSS to an output directory then we need to rewrite the
                                // relative resource URL inside the CSS to point to location of images in their
                                // original location
                                url = require('path').relative(outputDir, resource.getFilePath());
                            }
                            else {
                                var deferred = promises.defer();

                                //The image is a reference to a relative URL
                                try
                                {
                                    var outputPromise = context.writer.writeResource(resource);

                                    outputPromise.then(
                                        function(outputFileInfo) {
                                            var filename = outputFileInfo.filename;
                                            // Since resource was moved to the output directory where the CSS file is located,
                                            // the URL is simply the filename
                                            if (queryString === '?base64') {
                                                url = 'data:' + mime.lookup(filename) + ';base64,' + outputFileInfo.buffer.toString('base64');
                                            }
                                            else {
                                                url = filename + queryString;    
                                            }
                                            
                                            logger.debug("Resolved URL: " + inputUrl + ' --> ' + url);
                                            deferred.resolve(url);
                                        },
                                        function(e) {
                                            deferred.reject(e);
                                        });  
                                }
                                catch(e) {

                                    deferred.reject(e);
                                }

                                return deferred.promise;
                            }
                        }

                        url += queryString;
                        
                        logger.debug("Resolved URL: " + inputUrl + ' --> ' + url);

                        return url;
                    }, this);

                    // NOTE: output could be either the filter code or a promise, but we don't care
                    return output;
                }
                else {
                    return code;
                }
            }
        };
    });
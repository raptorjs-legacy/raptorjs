var path = require('path');
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
            contentType: 'text/css',
            
            name: module.id,

            filter: function(code, contentType, context) {

                if (contentType === 'text/css') {
                    var output = cssParser.replaceUrls(code, function(url) {
                        var outputDir;

                        if (strings.startsWith(url, "http://") ||
                            strings.startsWith(url, "https://") ||
                            strings.startsWith(url, "//")) {
                            return url;
                        }
                        var inputUrl = url;

                        var hashString = '',
                            hashStart = url.indexOf('#');

                        if (hashStart != -1) {
                            hashString = url.substring(hashStart);
                            url = url.substring(0, hashStart);
                        }

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

                                outputDir = context.writer.getOutputDir();
                                // This code block is for in-place deployment.
                                // If we are outputting the CSS to an output directory then we need to rewrite the
                                // relative resource URL inside the CSS to point to location of images in their
                                // original location
                                
                                var url = context.writer.urlBuilder.getInPlaceResourceUrl(
                                    resource.getFilePath(), 
                                    outputDir);



                                if (url) {
                                    url += queryString + hashString;
                                    logger.debug("Resolved URL: " + inputUrl + ' --> ' + url);
                                    return url;    
                                }
                                
                            }

                            var deferred = promises.defer();

                            //The image is a reference to a relative URL
                            try
                            {
                                var base64Encode = queryString === '?base64';

                                if (base64Encode && context.writer.base64EncodeSupported !== true) {
                                    // We only do the Base64 encoding if the writer prefers not
                                    // to do the Base64 encoding or does not support Base64 encoding
                                    url = 'data:' + mime.lookup(resource.getPath()) + ';base64,' + resource.readAsBinary().toString('base64');
                                    deferred.resolve(url);
                                }
                                else {
                                    context = require('raptor').extend({}, context);

                                    if (bundle.isInline() !== true &&
                                        context.writer.getOutputDir && (outputDir = context.writer.getOutputDir())) {
                                        // Reset the base path to the output location for the parent CSS file
                                        context.basePath = outputDir.toString();
                                    }

                                    context.base64EncodeUrl = base64Encode;
                                    context.cssDependency = dependency;
                                    context.cssBundle = bundle;

                                    context.writer.writeResource(resource, context)
                                        .then(
                                            function(outputFileInfo) {

                                                if (outputFileInfo.file) {
                                                    // The resource was written to disk, we can calculate
                                                    // a relative path from the optimizer output directory (where this CSS file will reside)
                                                    // to the output image/resource
                                                    url = path.relative(context.writer.getOutputDir(), outputFileInfo.file.getAbsolutePath()) + queryString + hashString;
                                                }
                                                else if (outputFileInfo.url) {
                                                    url = outputFileInfo.url + queryString + hashString;
                                                }
                                                else {
                                                    throw new Error('Invalid output from "context.writer.writeResource": ' + require('util').inspect(outputFileInfo));
                                                }

                                                logger.debug("Resolved URL: " + inputUrl + ' --> ' + url);
                                                deferred.resolve(url);
                                            },
                                            function(e) {
                                                deferred.reject(e);
                                            });
                                }
                            }
                            catch(e) {

                                deferred.reject(e);
                            }

                            return deferred.promise;
                            
                        }

                        url = inputUrl;
                        
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
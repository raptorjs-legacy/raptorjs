define(
    'raptor/optimizer/ResolveCSSUrlsFilter',
    function(require, exports, module) {
        "use strict";
        
        var logger = module.logger(),
            cssParser = require('raptor/css-parser'),
            strings = require('raptor/strings'),
            resources = require('raptor/resources');
        
        return {
            filter: function(code, contentType, dependency, bundle, context) {
                if (contentType === 'text/css') {
                    code = cssParser.replaceUrls(code, function(url) {

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

                        var resource = resources.resolveResource(dependency.getResource(), url);
                        if (resource && resource.exists()) {

                            var outputDir = context.writer.getOutputDir();

                            if (bundle.sourceResource) {
                                // This code block is for in-place deployment.
                                // If we are outputting the CSS to an output directory then we need to rewrite the
                                // relative resource URL inside the CSS to point to location of images in their
                                // original location
                                url = require('path').relative(outputDir, resource.getPath());
                            }
                            else {
                                //The image is a reference to a relative URL
                                var output = context.writer.writeResource(resource, true /* add checksum */);

                                // Since resource was moved to the output directory where the CSS file is located,
                                // the URL is simply the filename
                                url = output.filename;
                            }
                        }

                        url += queryString;
                        
                        logger.debug("Resolved URL: ", inputUrl + ' --> ' + url);

                        return url;
                    }, this);
                    return code;
                }
                else {
                    return code;
                }
            }
        };
    });
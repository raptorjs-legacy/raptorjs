raptor.define(
    'optimizer.ResolveCSSUrlsFilter',
    function() {
        "use strict";
        
        var cssParser = raptor.require('css-parser'),
            strings = raptor.require('strings'),
            resources = raptor.require('resources');
        
        return {
            filter: function(code, contentType, include, bundle, context) {
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


                        var resource = resources.resolveResource(include.getResource(), url);
                        if (resource && resource.exists()) {
                            //The image is a reference to a relative URL
                            var output = context.writer.writeResource(resource, contentType, true /* add checksum */);
                            url = output.url || url;
                        }

                        url += queryString;
                        
                        this.logger().debug("Resolved URL: ", inputUrl + ' --> ' + url);

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
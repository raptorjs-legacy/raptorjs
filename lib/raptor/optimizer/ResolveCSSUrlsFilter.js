var path = require('path');
define(
    'raptor/optimizer/ResolveCSSUrlsFilter',
    function(require, exports, module) {
        "use strict";

        function buildContext(context) {
            context = context ? raptor.extend({}, context) : {};
            var dependency = context.dependency;
            var bundle = context.bundle;
            var optimizer = context.optimizer;
            var writer = context.writer;

            context.cssDependency = dependency;
            context.cssBundle = bundle;
            context.relativeFromDir = writer.outptuDir;

            if (bundle) {
                context.inPlaceFromDir = writer.outptuDir;
            }

            return context;
        }
        
        var logger = module.logger(),
            cssParser = require('raptor/css-parser'),
            strings = require('raptor/strings'),
            resources = require('raptor/resources'),
            promises = require('raptor/promises'),
            mime = require('raptor/mime'),
            raptor = require('raptor');
        
        return {
            contentType: 'text/css',
            
            name: module.id,

            filter: function(code, contentType, context) {
                var resolveResourceUrlContext;

                var baseResource = context.dependency.getResource();

                if (contentType === 'text/css') {
                    var optimizer = context.optimizer;

                    var output = cssParser.replaceUrls(code, function(url) {
                        if (!resolveResourceUrlContext) {
                            // Lazily build the new context if we find a URL in the CSS code
                            resolveResourceUrlContext = buildContext(context);
                        }

                        return optimizer.resolveResourceUrl(url, baseResource, resolveResourceUrlContext);
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
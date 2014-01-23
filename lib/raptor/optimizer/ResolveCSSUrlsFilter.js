define('raptor/optimizer/ResolveCSSUrlsFilter', function (require, exports, module) {
    'use strict';
    var raptor = require('raptor');
    var cssParser = require('raptor/css-parser');
    function buildContext(context) {
        context = context ? raptor.extend({}, context) : {};
        var dependency = context.dependency;
        var bundle = context.bundle;
        var writer = context.writer;
        context.cssDependency = dependency;
        context.cssBundle = bundle;
        context.relativeFromDir = writer.outputDir;
        if (bundle) {
            context.inPlaceFromDir = writer.outputDir;
        }
        return context;
    }
    return {
        contentType: 'text/css',
        name: module.id,
        filter: function (code, contentType, context) {
            var resolveResourceUrlContext;
            var baseResource = context.dependency.getResource();
            if (contentType === 'text/css') {
                var optimizer = context.optimizer;
                var output = cssParser.replaceUrls(code, function (url) {
                        if (!resolveResourceUrlContext) {
                            // Lazily build the new context if we find a URL in the CSS code
                            resolveResourceUrlContext = buildContext(context);
                        }
                        return optimizer.resolveResourceUrl(url, baseResource, resolveResourceUrlContext);
                    }, this);
                // NOTE: output could be either the filter code or a promise, but we don't care
                return output;
            } else {
                return code;
            }
        }
    };
});
define(
    'raptor/templating/taglibs/optimizer/ImgTag',
    function(require, exports, module) {
        "use strict";

        var optimizer = require('raptor/optimizer');
        
        return {
            render: function(input, context) {
                var pageOptimizer = input.optimizer;

                if (!pageOptimizer) {
                    pageOptimizer = optimizer.pageOptimizer;
                }
                
                if (!pageOptimizer) {
                    throw raptor.createError(new Error('Page optimizer not configured for application. require("raptor/optimizer").configure(config) or provide an optimizer as input using the "optimizer" attribute.'));
                }

                var src = input.src;
                var templateInfo = input.templateInfo || {};

                context.beginAsyncFragment(function(asyncContext, asyncFragment) {
                    return pageOptimizer.resolveResourceUrl(src, templateInfo.resource)
                        .then(function(url) {
                            asyncContext.write('<img src="' + url + '"');        
                            if (input.dynamicAttributes) {
                                asyncContext.attrs(input.dynamicAttributes);
                            }
                            asyncContext.write('>');
                        });
                });
            }
        };
    });
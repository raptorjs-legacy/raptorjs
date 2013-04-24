define(
    'raptor/templating/taglibs/optimizer/SlotTag',
    function(require, exports, module) {
        "use strict";

        var promises = require('raptor/promises'),
            logger = module.logger();
        
        return {
            process: function(input, context) {
                var slotName = input.name;
                
                var optimizedPage = context.getAttributes().optimizedPage;

                if (!optimizedPage) {
                    throw require('raptor').createError(new Error('Optimized page not found for slot "' + slotName + '". The <optimizer:page> tag should be used to generate the optimized page.'));
                }

                function renderSlot(context, optimizedPage) {
                    var slotHtml = optimizedPage.getSlotHtml(slotName);
                    if (slotHtml) {
                        context.write(slotHtml);
                    }
                }

                if (!promises.isPromise(optimizedPage)) {
                    renderSlot(context, optimizedPage);
                }
                else {
                    context.beginAsyncFragment(function(asyncContext, asyncFragment) {
                        var onError = function(e) {
                            logger.error('An error has occurred: ' + e, e);
                            asyncFragment.end();
                        }
                        
                        optimizedPage.then(
                            function(optimizedPage) {
                                renderSlot(asyncContext, optimizedPage);
                                asyncFragment.end();
                            },
                            onError);
                    });
                }
                
            }
        };
    });
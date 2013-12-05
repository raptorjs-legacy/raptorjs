define(
    'raptor/templating/taglibs/optimizer/SlotTag',
    function(require, exports, module) {
        "use strict";

        var promises = require('raptor/promises'),
            logger = module.logger(),
            optimizer = require('raptor/optimizer');
        
        return {
            process: function(input, context) {
                var slotName = input.name;
                
                var optimizedPagePromise = context.attributes.optimizedPage;
                var optimizerContext = optimizer.getRenderContext(context);

                if (!optimizedPagePromise) {
                    throw require('raptor').createError(new Error('Optimized page not found for slot "' + slotName + '". The <optimizer:page> tag should be used to generate the optimized page.'));
                }

                optimizerContext.emitBeforeSlot(slotName, context);

                function renderSlot(context, optimizedPage) {
                    
                    var slotHtml = optimizedPage.getSlotHtml(slotName);
                    
                    if (slotHtml) {
                        context.write(slotHtml);
                    }

                    optimizerContext.emitAfterSlot(slotName, context);
                }

                var optimizedPage = promises.valueOfPromise(optimizedPagePromise);

                if (optimizedPage) {
                    renderSlot(context, optimizedPage);
                }
                else {
                    context.beginAsyncFragment(function(asyncContext, asyncFragment) {
                        var onError = function(e) {
                            logger.error('An error has occurred for slot "' + slotName + '". Exception: ' + (e.stack || e));
                            asyncFragment.end();
                        };
                        
                        optimizedPagePromise
                            .then(function(optimizedPage) {
                                try
                                {
                                    renderSlot(asyncContext, optimizedPage);
                                    asyncFragment.end();
                                }
                                catch(e) {
                                    onError(e);
                                }
                            })
                            .fail(onError);
                    });
                }
            }
        };
    });
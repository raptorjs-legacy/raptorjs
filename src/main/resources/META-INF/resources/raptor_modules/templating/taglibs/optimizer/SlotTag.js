raptor.define(
    'templating.taglibs.optimizer.SlotTag',
    function(raptor) {
        "use strict";
        
        return {
            process: function(input, context) {
                var slotName = input.name;
                var optimizerPage = context.getAttributes().optimizerPage;
                if (!optimizerPage) {
                    throw raptor.createError(new Error('Optimizer page not defined for template. The <optimizer:page> tag should be used to define the optimizer page.'));
                }
                
                var optimizer = raptor.require('optimizer').getOptimizerFromContext(context);
                var includes = optimizer.getPageHtmlBySlot(optimizerPage)[slotName];
                if (includes) {
                    context.write(includes);
                }
                
            }
        };
    });
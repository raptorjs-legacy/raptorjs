define(
    'raptor/templating/taglibs/optimizer/SlotTag',
    function(require, exports, module) {
        "use strict";
        
        return {
            process: function(input, context) {
                var slotName = input.name;
                
                var optimizedPage = context.getAttributes().optimizedPage;
                
                if (!optimizedPage) {
                    throw raptor.createError(new Error('Optimized page not found for slot "' + slotName + '". The <optimizer:page> tag should be used to generate the optimized page.'));
                }
                
                var includes = optimizedPage.getSlotHtml(slotName);
                if (includes) {
                    context.write(includes);
                }
                
            }
        };
    });
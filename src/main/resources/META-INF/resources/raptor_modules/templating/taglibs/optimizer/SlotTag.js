raptor.define(
    'templating.taglibs.optimizer.SlotTag',
    function(raptor) {
        
        return {
            process: function(input, context) {
                var slotName = input.name;
                var optimizerPage = context.getAttributes().optimizerPage;
                if (!optimizerPage) {
                    throw raptor.createError(new Error('Optimizer page not defined for template. The <optimizer:page> tag should be used to define the optimizer page.'));
                }
                
                var optimizer = raptor.require('optimizer').getFromContext(context);
                var includes = optimizer.getPageIncludes(optimizerPage)[slotName];
                if (includes) {
                    context.write(includes);
                }
                
            }
        };
    });
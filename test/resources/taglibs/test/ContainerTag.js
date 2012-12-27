define.Class(
    'taglibs.test.ContainerTag',
    function(require) {
        
        return {
            process: function(input, context) {
                
                context.renderTemplate(
                    "taglibs/test/Container",
                    {
                        title: input.title,
                        invokeBody: input.invokeBody
                    });
            }
        };
    }
);
raptor.defineClass(
    'taglibs.test.ContainerTag',
    function(raptor) {
        
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
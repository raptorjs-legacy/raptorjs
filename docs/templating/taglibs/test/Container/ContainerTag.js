raptor.defineClass(
    'taglibs.test.Container.ContainerTag',
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
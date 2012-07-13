raptor.defineClass(
    'taglibs.widgets.test.ContainerTag',
    function(raptor) {
        
        return {
            process: function(input, context) {
                
                context.addWidget(
                    'test.ContainerWidget',
                    input,
                    null,
                    function(widget) {
                        context.renderTemplate(
                            "test/Container",
                            {
                                title: input.title,
                                invokeBody: input.invokeBody,
                                widget: widget
                            });
                    });
            }
        };
    }
);
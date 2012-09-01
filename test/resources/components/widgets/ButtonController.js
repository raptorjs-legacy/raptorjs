raptor.defineClass(
    'components.widgets.ButtonController',
    function(raptor) {
        
        return {
            process: function(input, context) {
                var disabled = input.disabled === true;
                
                context.renderTemplate(
                    "components/widgets/Button",
                    {
                        label: input.label,
                        id: input.id,
                        widgetConfig: {
                            disabled: disabled                            
                        },
                        invokeBody: input.invokeBody,
                        widgetArgs: input.widgetArgs,
                        buttonAttrs: {
                            disabled: disabled ? null : undefined,
                            type: input.type || "button"
                        }
                    });
            }
        };
    }
);
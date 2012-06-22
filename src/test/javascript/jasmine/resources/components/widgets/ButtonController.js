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
                        widgetConfig: {
                            disabled: disabled                            
                        },
                        widgetContext: input.widgetContext,
                        buttonAttrs: {
                            disabled: disabled ? null : undefined,
                            type: input.type || "button"
                        }
                    });
            }
        };
    }
);
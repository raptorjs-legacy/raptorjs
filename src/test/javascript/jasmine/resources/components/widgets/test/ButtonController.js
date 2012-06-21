raptor.defineClass(
    'components.widgets.test.ButtonController',
    function(raptor) {
        
        return {
            process: function(input, context) {
                var disabled = input.disabled === true;
                context.renderTemplate(
                    "components/widgets/test/Button",
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
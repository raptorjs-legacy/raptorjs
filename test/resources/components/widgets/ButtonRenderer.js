define(
    'components/widgets/ButtonRenderer',
    function(require) {
        
        return {
            render: function(input, context) {
                var disabled = input.disabled === true;
                
                context.renderTemplate(
                    "components/widgets/Button",
                    {
                        label: input.label,
                        id: input.id || ('btn' + context.uniqueId()),
                        widgetConfig: {
                            disabled: disabled,
                            label: input.label                    
                        },
                        invokeBody: input.invokeBody,
                        buttonAttrs: {
                            disabled: disabled ? null : undefined,
                            type: input.type || "button"
                        }
                    });
            }
        };
    }
);
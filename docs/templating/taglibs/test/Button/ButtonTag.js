raptor.defineClass(
    'taglibs.test.Button.ButtonTag',
    function(raptor) {
        
        return {
            process: function(input, context) {
                var disabled = input.disabled === true;
                context.renderTemplate(
                    "taglibs/test/Button",
                    {
                        label: input.label,
                        widgetContext: input.widgetContext,
                        widgetConfig: {
                            disabled: disabled
                        },
                        buttonAttrs: {
                            disabled: disabled ? null : undefined,
                            type: input.type || "button"
                        }
                    });
            }
        };
    }
);
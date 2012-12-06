define.Class(
    'taglibs.test.ButtonTag',
    function(require) {
        
        return {
            process: function(input, context) {
                var disabled = input.disabled === true;
                context.renderTemplate(
                    "taglibs/test/Button",
                    {
                        label: input.label,
                        widgetArgs: input.widgetArgs,
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
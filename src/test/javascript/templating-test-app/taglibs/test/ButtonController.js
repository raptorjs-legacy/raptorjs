raptor.defineClass(
    'taglibs.test.ButtonController',
    function(raptor) {
        var templating = raptor.require('templating');
        
        return {
            process: function(input, context) {
                var disabled = input.disabled === true;
                
                templating.render(
                    "test/Button",
                    {
                        label: input.label,
                        buttonAttrs: {
                            id: input.id,
                            disabled: disabled ? null : undefined,
                            type: input.type || "button"
                        }
                    },
                    context);
            }
        };
    }
);
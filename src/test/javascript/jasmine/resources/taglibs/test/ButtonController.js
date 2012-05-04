raptor.defineClass(
    'taglibs.test.ButtonController',
    function(raptor) {
        var templating = raptor.require('templating');
        
        return {
            process: function(input, context) {
                var disabled = input.disabled === true;
                
                
                var widget = context.addWidget({
                        type: 'test.ButtonWidget', 
                        attributes: input["http://ebay.com/raptor/widgets"],
                        clientConfig: {
                            disabled: disabled                            
                        }
                    });
                
                templating.render(
                    "test/Button",
                    {
                        label: input.label,
                        widget: widget,
                        buttonAttrs: {
                            disabled: disabled ? "disabled" : undefined,
                            type: input.type || "button"
                        }
                    },
                    context);
            }
        };
    }
);
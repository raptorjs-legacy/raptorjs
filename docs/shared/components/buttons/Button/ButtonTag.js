raptor.define(
    "components.buttons.Button.ButtonTag",
    function(raptor) {
        var ButtonTag = function() {
            
        };
        
        ButtonTag.prototype = {
            process: function(input, context) {
                
                var rootAttrs = {};
                
                var classParts = ["btn"];
                
                if (input.type) {                    
                    classParts.push("btn-" + input.type);
                }
                
                rootAttrs["class"] = classParts.join(" ");
                
                if (input["*"]) {
                    raptor.extend(rootAttrs, input["*"]);
                }
                
                var widgetConfig = {};
                
                if (input.toggle) {
                    widgetConfig.toggle = true;
                }
                
                if (input.toggled) {
                    widgetConfig.toggled = true;
                }

                raptor.require('templating').render('components/buttons/Button', {
                    tag: input, 
                    label: input.label,
                    rootAttrs: rootAttrs,
                    widgetContext: input.widgetContext,
                    widgetConfig: widgetConfig,
                    isDropdown: input.dropdown === true
                }, context);
            }
        };
        
        return ButtonTag;
    });
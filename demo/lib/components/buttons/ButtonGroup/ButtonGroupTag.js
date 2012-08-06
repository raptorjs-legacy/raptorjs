raptor.define(
    "components.buttons.ButtonGroup.ButtonGroupTag",
    function(raptor) {
        var ButtonGroupTag = function() {
            
        };
        
        ButtonGroupTag.prototype = {
            process: function(input, context) {
                
                var rootAttrs = {};
                
                if (input.toggle) {
                    rootAttrs["data-toggle"] = "buttons-" + input.toggle;
                }
                
                raptor.require('templating').render('components/buttons/ButtonGroup', {
                    tag: input, 
                    rootAttrs: rootAttrs
                }, context);
            }
        };
        
        return ButtonGroupTag;
    });
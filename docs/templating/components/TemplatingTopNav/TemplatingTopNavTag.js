raptor.define(
    "components.TemplatingTopNav.TemplatingTopNavTag",
    function(raptor) {
        var TopNavTag = function() {
            
        };
        
        TopNavTag.prototype = {
            process: function(input, context) {
                
                raptor.require('templating').render('components/TemplatingTopNav', {
                    activeItem: input.activeItem
                }, context);
            }
        };
        
        return TopNavTag;
    });
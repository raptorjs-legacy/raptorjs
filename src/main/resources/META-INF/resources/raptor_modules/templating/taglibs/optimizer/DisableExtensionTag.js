raptor.define(
    'templating.taglibs.optimizer.DisableExtensionTag',
    function(raptor) {
        "use strict";
        
        var optimizer = raptor.require('optimizer');
        
        return {
            process: function(input, context) {
                optimizer.disableExtensionForContext(context, input.name);
            }
        };
    });
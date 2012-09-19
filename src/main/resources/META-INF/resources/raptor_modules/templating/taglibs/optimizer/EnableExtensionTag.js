raptor.define(
    'templating.taglibs.optimizer.DisableExtensionTag',
    function(raptor) {
        "use strict";
        
        return {
            process: function(input, context) {
                var optimizer = raptor.require('optimizer');
                optimizer.disableExtensionForContext(context, input.name);
            }
        };
    });
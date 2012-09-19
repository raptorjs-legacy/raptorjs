raptor.define(
    'templating.taglibs.optimizer.EnableExtensionTag',
    function(raptor) {
        "use strict";
        
        return {
            process: function(input, context) {
                var optimizer = raptor.require('optimizer');
                optimizer.enableExtensionForContext(context, input.name);
            }
        };
    });
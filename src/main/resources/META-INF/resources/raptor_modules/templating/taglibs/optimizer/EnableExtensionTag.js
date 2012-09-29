raptor.define(
    'templating.taglibs.optimizer.EnableExtensionTag',
    function(raptor) {
        "use strict";
        
        var optimizer = raptor.require('optimizer');
        
        return {
            process: function(input, context) {
                optimizer.enableExtensionForContext(context, input.name);
            }
        };
    });
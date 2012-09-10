raptor.define(
    'templating.taglibs.optimizer.EnableExtensionTag',
    function(raptor) {
        
        return {
            process: function(input, context) {
                var optimizer = raptor.require('optimizer');
                optimizer.enableExtensionForContext(context, input.name);
            }
        };
    });
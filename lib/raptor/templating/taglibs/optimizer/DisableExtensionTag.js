define(
    'raptor/templating/taglibs/optimizer/DisableExtensionTag',
    function(require, exports, module) {
        "use strict";
        
        var optimizer = require('raptor/optimizer');
        
        return {
            process: function(input, context) {
                optimizer.disableExtensionForContext(context, input.name);
            }
        };
    });
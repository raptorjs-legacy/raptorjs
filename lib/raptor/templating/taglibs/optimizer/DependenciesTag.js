define(
    'raptor/templating/taglibs/optimizer/DependenciesTag',
    function(require, exports, module) {
        "use strict";
        
        return {
            process: function(input, context) {
                if (input.invokeBody) {
                    input.invokeBody();
                }
            }
        };
    });
define(
    'raptor/templating/taglibs/optimizer/CommentTag',
    function(require, exports, module) {
        "use strict";
        
        return {
            process: function(input, context) {
                context.write('<!--');
                if (input.invokeBody) {
                    input.invokeBody();
                }
                context.write('-->');
            }
        };
    });
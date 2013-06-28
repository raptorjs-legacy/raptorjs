define(
    'raptor/templating/taglibs/optimizer/DependencyTag',
    function(require, exports, module) {
        "use strict";
        
        return {
            process: function(input, context) {
                var dependenciesParent = input.dependenciesParent;
                if (!dependenciesParent) {
                    throw new Error('Expected property "dependenciesParent"');
                }

                delete input.dependenciesParent;

                dependenciesParent.addDependency(input);
            }
        };
    });
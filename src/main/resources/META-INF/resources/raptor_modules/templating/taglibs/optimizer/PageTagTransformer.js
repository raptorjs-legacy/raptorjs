raptor.define(
    'templating.taglibs.optimizer.PageTagTransformer',
    function(raptor) {
        "use strict";
        
        return {
            process: function(node, compiler, template) {
                node.setProperty("templatePath", template.makeExpression(JSON.stringify(template.getPath())));
            }
        };
    });
define(
    "components.jsdoc.Prop.PropTagTransformer",
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var VarNode = require('raptor/templating/taglibs/core/VarNode');
        
        return {
            process: function(node, compiler, template) {
                var varName = node.getAttribute("var");
                if (varName) {
                    var propName = node.getAttribute("name");
                    template.addHelperFunction("taglibs.jsdoc.JSDocFunctions", "prop", false, "jsdocProp");
                    var varNode = new VarNode({
                        "name": varName,                        
                        "value": template.makeExpression("jsdocProp(" + JSON.stringify(propName) + ")"),
                        pos: node.getPosition()
                    });
                    
                    node.parentNode.insertBefore(varNode, node);
                    node.detach(); //Remove the old node
                }
            }
        };
    });
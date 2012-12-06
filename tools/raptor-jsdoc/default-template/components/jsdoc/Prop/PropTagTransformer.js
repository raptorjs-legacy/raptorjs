raptor.define(
    "components.jsdoc.Prop.PropTagTransformer",
    function(raptor) {
        "use strict";
        
        var VarNode = raptor.require('raptor/templating/taglibs/core/VarNode');
        
        return {
            process: function(node, compiler, template) {
                var varName = node.getAttribute("var");
                if (varName) {
                    var propName = node.getAttribute("name");
                    
                    var varNode = new VarNode({
                        "name": varName,                        
                        "value": template.makeExpression("raptor.require('jsdoc-util').getProp(" + JSON.stringify(propName) + ")"),
                        pos: node.getPosition()
                    });
                    
                    node.parentNode.insertBefore(varNode, node);
                    node.detach(); //Remove the old node
                }
            }
        };
    });
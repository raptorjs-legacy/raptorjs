raptor.define(
    "components.jsdoc.Prop.PropTag",
    function(raptor) {
        var jsdocUtil = raptor.require("jsdoc-util");
        
        var PropTag = function(config) {
            
        };
        
        PropTag.prototype = {
            process: function(input, context) {
                var name = input.name;
                var value = jsdocUtil.getProp(name) || input['default'];
                if (value) {
                    context.write(value);    
                }
            }
        };
        
        return PropTag;
    });
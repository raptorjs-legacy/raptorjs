define(
    "components.jsdoc.Prop.PropTag",
    ['raptor'],
    function(raptor, require) {
        var jsdocUtil = require('jsdoc-util');
        
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
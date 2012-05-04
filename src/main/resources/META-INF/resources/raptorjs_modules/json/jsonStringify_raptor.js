/**
 * 
 * @extension Raptor Stringify
 * 
 */
raptor.extend('json', {
    extend: function(target) {
        var stringify = raptor.require("json.stringify").stringify;
        
        //NOTE: Target is the "json" module that we are extending with this mixin
        target.registerImpl('raptor', 'stringify', stringify);
        
        return /** @lends json_Raptor_Stringify */ {
            /**
             * @funtion
             * @param o {Object} The object to stringify
             * @returns {String} The JSON string representation of the provided object
             */
            raptorStringify: stringify
        };
    }
});
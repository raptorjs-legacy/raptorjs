/**
 * 
 * @extension Raptor Parse
 * 
 */
raptor.extend('json', {
    extend: function(target) {
        var parse = raptor.require("json.parse").parse;
        
        target.registerImpl('raptor', 'parse', parse);
        
        return /** @lends json_Raptor_Parse */ {
            /**
             * 
             * @function
             * 
             * @param s {String} The JSON string to parse
             * @returns {Object} The native JavaScript object that represents the JSON string
             */
            raptorParse: parse
        };
    }
});
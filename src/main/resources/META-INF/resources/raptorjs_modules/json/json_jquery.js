/**
 * 
 * @extension jQuery Parse
 * 
 */
raptor.extend('json', {
    extend: function(target) {
        var parse = $.parseJSON;
        
        //NOTE: Target is the "json" module that we are extending with this mixin
        target.registerImpl('jquery', 'parse', parse);
        
        return /** @lends json_jQuery_Parse */ {
            /**
             * 
             * @function
             * 
             * @param s {String} The JSON string to parse
             * @returns {Object} The native JavaScript object that represents the JSON string
             */
            jqueryParse: parse
        };
        
    }
});
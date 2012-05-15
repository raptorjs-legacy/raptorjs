$rload(function(raptor) {
    var EMPTY_STRING = '',
        trim = function(s){
            return s ? s.replace(/^\s*|\s*$/g,'') : EMPTY_STRING;
        };
    
    
    raptor.defineCore('strings', {

        compare: function(s1, s2)
        {
            return s1 < s2 ? -1 : (s1 > s2 ? 1 : 0);
        },
        
        /**
         * @param {string} s The string to operate on
         * @return {boolean} Returns true if the string is null or only consists of whitespace
         * 
         * @static
         */
        isEmpty: function(s)
        {
            return s == null || trim(s).length === 0;
        },

        /**
         * @param {string} s The string to operate on
         * @return {integer} Returns the length of the string or 0 if the string is null
         * 
         * @static
         */
        length: function(s)
        {
            return s == null ? 0 : s.length;
        },

        /**
         * @param {object} o The object to test
         * @return {boolean} Returns true if the object is a string, false otherwise.
         * 
         * @static
         */
        isString: function(o)
        {
            return o != null && o.constructor === String;
        },

        /**
         * Tests if two strings are equal
         * 
         * @param s1 {string} The first string to compare
         * @param s2 {string} The second string to compare
         * @param shouldTrim {boolean} If true the string is trimmed, otherwise the string is not trimmed (optional, defualts to true)
         * @return {boolean} Returns true if the strings are equal, false otherwise
         * 
         * @static
         */
        equals: function(s1, s2, shouldTrim)
        {        
            if (shouldTrim !== false)
            {
                s1 = trim(s1);
                s2 = trim(s2);
            }
            return s1 == s2;
        },

        /**
         * Tests if two strings are not equal
         * 
         * @param s1 {string} The first string to compare
         * @param s2 {string} The second string to compare
         * @param trim {boolean} If true the string is trimmed, otherwise the string is not trimmed (optional, defualts to true)
         * @return {boolean} Returns true if the strings are equal, false otherwise
         * 
         * @see #equals
         * @static
         */
        notEquals: function(s1, s2, shouldTrim)
        {
            return this.equals(s1, s2, shouldTrim) === false;
        },
        
        trim: trim,

        ltrim: function(s){
            return s ? s.replace(/^\s*/g,'') : EMPTY_STRING;
        },

        rtrim: function(s){
            return s ? s.replace(/\s*$/g,'') : EMPTY_STRING;
        },

        startsWith: function(s, prefix) {
            if (!s || s.length < prefix.length) return false;
            else return s.substring(0, prefix.length) === prefix;
        },

        endsWith: function(s, suffix) {
            if (!s || s.length < suffix.length) return false;
            else return s.substring(s.length - suffix.length) === suffix;
        },
        
        /**
         * 
         * @param c
         * @returns
         */
        unicodeEncode: function(c) {
            return '\\u'+('0000'+(+(c.charCodeAt(0))).toString(16)).slice(-4);
        }
        
    });
});
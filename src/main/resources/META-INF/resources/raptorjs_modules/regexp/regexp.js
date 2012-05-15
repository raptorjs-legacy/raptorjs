$rload(function(raptor) {
    var simpleSpecial = {
        "*": ".*?",
        "?": ".?"
    };
    
    
    raptor.defineCore('regexp', {
        
        /**
         * Escapes special regular expression characters in a string so that the resulting string can be used
         * as a literal in a constructed RegExp object.
         * 
         * Example:
         * <js>
         * strings.escapeRegExp("hello{world}");
         * //output: "hello\{world\}"
         * </js>
         * @param str The string to escape
         * @returns {String} The string with all special regular expression characters escaped
         */
        escape: function(str) {
            return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
        },
        
        /**
         * Converts a string consisting of two types of wildcards to a regular expression:
         * Question Mark (?) - Represents a single character that can be any character
         * Asterisk (*) - This represents any sequence of characters 
         * 
         * @param {String} str The string that represents the simple regular expression
         * @return {RegExp} The resulting regular expression
         */
        simple: function(str) {
            var _this = this;
            
            return new RegExp("^" + str.replace(/[\*\?]|[^\*\?]*/g, function(match) {
                return simpleSpecial[match] || _this.escape(match);
            }) + "$");
        }
        
    });
});
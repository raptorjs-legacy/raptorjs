$rload(function(raptor) {
    
    /**
     * Used to build a string by using an array of strings as a buffer.
     * When it is ready to be converted to a string the array elements
     * are joined together with an empty space.
     * 
     * @constructs
     * @constructor Initializes an empty StringBuilder
     * @class
     */
    var StringBuilder = function() {
        /**
         * @type Array
         */
        this.array = [];
        
        /**
         * The length of the string
         * @type Number
         */
        this.length = 0;
        
        this.memberProp = true;
    };

    StringBuilder.prototype = {
            /**
             * Appends a string to the string being constructed.
             * 
             * @param {Object} obj The string or object to append
             * @returns {strings_StringBuilder-StringBuilder} Returns itself
             */
            append: function(obj)
            {
                var str = obj == null ? 'null' : obj.toString();
                this.length += str.length;
                this.array.push(str);
                return this;
            },
            
            /**
             * Appends a string to the string being constructed.
             * 
             * @param {Object} obj The string or object to append
             * @returns {strings_StringBuilder-StringBuilder} Returns itself
             */
            write: function(obj)
            {
                return this.append(obj);
            },
            
            /**
             * Converts the string buffer into a String.
             * 
             * @returns {String} The built String
             */
            toString: function()
            {
                return this.array.join('');
            },
            
            /**
             * Clears the string
             * 
             * @returns {strings_StringBuilder-StringBuilder} Returns itself
             */
            clear: function()
            {
                this.array = [];
                this.length = 0;
                return this;
            }
    };
    
    /**
     * @extension StringBuilder
     */
    raptor.extendCore('strings', {

        /**
         * A reference to the string builder class
         * @type strings_StringBuilder-StringBuilder
         */
        StringBuilder: StringBuilder,
        
        /**
         * @return {strings_StringBuilder-StringBuilder} Returns a newly created StringBuilder
         */
        createStringBuilder: function() {
            return new StringBuilder();
        }
    });
});
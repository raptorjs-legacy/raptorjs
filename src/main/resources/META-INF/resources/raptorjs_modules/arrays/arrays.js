raptorBuilder.addLoader(function (raptor) {
    
    /**
     * Utility module for working with JavaScript arrays.
     * 
     * @borrows raptor.forEach as forEach
     * @borrows raptor.isArray as isArray
     * @borrows raptor.arrayFromArguments as fromArguments
     */
    raptor.defineCore('arrays', {

        forEach: raptor.forEach,

        isArray: raptor.isArray,

        fromArguments: raptor.arrayFromArguments,
        
        /**
         * Concatenates multiple arrays into a single array.
         * 
         * <p>
         * Example:
         * <js>
         * var result = arrays.concatArrays([1, 2], [3, 4]);
         * //result = [1, 2, 3, 4]
         * </js>
         * 
         * </p>
         * @param {...[Array]} arrays A variable number of Array objects as parameters 
         * @returns {Array}
         */
        concatArrays: function(arrays)
        {
            var result = [],
                i=0,
                len=arguments.length,
                a;
            for (; i<len; i++)
            {
                a = arguments[i];
                if (a != null)
                {
                    result = result.concat.apply(result, a);
                }
            }

            return result;
        },
        
        pop: function(array) {
            var last = this.peek(array);
            array.splice(array.length-1, 1);
            return last;
        },
        
        peek: function(array) {
            return array && array.length ? array[array.length-1] : undefined;
        }
        
    });
});
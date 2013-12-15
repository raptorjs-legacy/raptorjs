/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('raptor/arrays', ['raptor'], function(raptor, require) {
    'use strict';
    
    var _Array = Array,
        isArray = _Array.isArray,
        arrayFromArguments = raptor.arrayFromArguments;
    
    /**
     * Utility module for working with JavaScript arrays.
     *
     */
    return {

        /**
         * 
         * Iterates over the elements in an array and invokes a provided callback function with the current element for each iteration.
         * 
         * @param {Array|Object|null} a The array to iterate over
         * @param {function} fun The callback function to use for each iteration of the array. The following parameters are passed to the callback function: 1) element 2) index 3) the array itself
         * @param thisp The "this" object to use for the callback function
         */
        forEach: raptor.forEach,

        isArray: isArray,

        fromArguments: arrayFromArguments,
        arrayFromArguments: arrayFromArguments,
        
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
    };
});
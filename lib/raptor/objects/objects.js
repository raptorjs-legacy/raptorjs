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

define('raptor/objects', ['raptor'], function(raptor) {
    "use strict";
    
    /**
     * @borrows raptor/forEachEntry as forEachEntry
     */
    return {
        extend: raptor.extend,
        
        /**
         * Traverses all of the properties for an object and invokes
         * the provided callback function for each property found.
         * 
         * The parameters passed to the callback function are the "key" and the "value".
         * If the callback function returns "false" then iteration is stopped.
         * 
         * @param o {object} The object to operate on
         * @param fun {function} The callback function
         * @param thisp {object} The object to use as "this" for the callback function
         * 
         * @return {void}
         * 
         */
        forEachEntry: raptor.forEachEntry,
       
        /**
         * 
         * @param o
         * @returns {Array}
         */
        keys: function(o) {
            return Object.keys(o);
        },

        /**
         * @static
         */
        values: function(o) {
            var values = [];
            
            for (var k in o) {
                if (o.hasOwnProperty(k))
                {
                    values.push(o[k]);
                }
            }

            return values;
        },

        /**
         * @static
         */
        entries: function(o) {
            var entries = [];
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    entries.push({key: k, value: o[k]});
                }
            }

            return entries;
        },
        
        isEmpty: function(o) {
            if (!o) {
                return true;
            }
            
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    return false;
                }
            }
            return true;
        }
    };    
});
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

$rload(function(raptor) {
    "use strict";
    
    /**
     * @borrows raptor.forEachEntry as forEachEntry
     * @borrows raptor.keys as keys
     */
    raptor.defineCore('objects', {
        extend: raptor.extend,
        
        
        forEachEntry: raptor.forEachEntry,
       
        keys: raptor.keys,

        /**
         * @static
         */
        values: function(o)
        {
            var values = [];
            for (var k in o)
            {
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
        entries: function(o)
        {
            var entries = [];
            for (var k in o)
            {
                if (o.hasOwnProperty(k))
                {
                    entries.push({key: k, value: o[k]});
                }
            }

            return entries;
        }
    });    
});
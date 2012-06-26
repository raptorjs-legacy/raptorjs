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
    
    var java = __rhinoHelpers.getJava();
    
    /**
     * @namespace
     * @raptor
     * @name java
     */
    raptor.java = /** @lends java */ {

        convertString: function(str) 
        {
            return str == null ? null : '' + str;
        },
        
        convert: function(value)
        {
            if (value == null) {
                return null;
            }
            else if (java.isString(value))
            {
                value = '' + value;
            } 
            else if (java.isNumber(value))
            {
                value = 0 + value;
            }
            else if (java.isBoolean(value))
            {
                value = value === true;
            } 
            else if (java.isArray(value))
            {
                value = this.convertArray(value);
            } 
            else if (java.isCollection(value))
            {
                value = this.convertCollection(value);
            } 
            else if (java.isMap(value))
            {
                value = this.convertMap(value);
            } 
            else
            {
                value = '' + value;
            }
        },

        convertArray: function(javaArray, convertFunc)
        {
            var out = [];
            
            for (var i=0, len=javaArray.length; i<len; i++)
            {
                out.push(this.convert(javaArray[i]));
            }
            
            return out;
        },
        
        convertCollection: function(javaCollection, convertFunc)
        {
            var out = [];
            var javaIterator = javaCollection.iterator();
            while(javaIterator.hasNext())
            {
                var javaObject = javaIterator.next();
                out.push(this.convert(javaObject));
            }
            return out;
        },
        
        convertMap: function(javaMap, convertFunc)
        {
            var out = {};

            var javaIterator = javaMap.entrySet().iterator();
            while(javaIterator.hasNext())
            {
                var javaEntry = javaIterator.next();
                out['' + javaEntry.getKey()] = this.convert(javaEntry.getValue());
            }
            return out;
        },
        
        getStringInputStream: function(str) {
            return java.getStringInputStream(str);
        }
    };
});
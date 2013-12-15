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

define('raptor/regexp', function(require) {
    'use strict';
    
    var simpleSpecial = {
        "*": ".*?",
        "?": ".?"
    };

    return {
        
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
        
    };
});
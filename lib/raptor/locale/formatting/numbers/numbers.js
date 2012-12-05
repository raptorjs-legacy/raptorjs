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

define('raptor/locale/formatting/numbers', function(require, exports, module) {
    "use strict";
    
    /**
     * @class
     * @name locale.formatting.numbers-NumberFormatter
     * @anonymous
     */
    var NumberFormatter = function(sep) {
        this.sub = '$1' + sep + '$2$3';
        this.exp = new RegExp('(\\d)(\\d{3})(' + ((sep == '.')?'\\.':sep) + '|$)');
    };

    NumberFormatter.prototype = {

        /**
         * 
         * @param num {number} The number to be formatted
         * @returns {String} The formatted number
         */
        format : function(num) {
            var self = this,
                exp = self.exp,
                sub = self.sub;
            
            num = num + '';
                
            while (exp.test(num)) {
                num = num.replace(exp,sub);
            }
            return num;
        }
    };
    
    return {
        /**
         * 
         * @param config
         * @returns {raptor/locale/formatting/numbers/NumberFormatter} The NumberFormatter instance based on the formatter configuration
         */
        createFormatter: function(config) {
            config = config || {};
            var groupSeparator = config.groupSeparator || ',';
            return new NumberFormatter(groupSeparator);
        } 
    };
});
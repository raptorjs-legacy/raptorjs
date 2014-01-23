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
define('raptor/strings/StringBuilder', function (require) {
    'use strict';
    /**
     * Used to build a string by using an array of strings as a buffer.
     * When it is ready to be converted to a string the array elements
     * are joined together with an empty space.
     * 
     * @constructs
     * @constructor Initializes an empty StringBuilder
     * @class
     */
    var StringBuilder = function () {
        /**
         * @type Array
         */
        this.array = [];
        /**
         * The length of the string
         * @type Number
         */
        this.length = 0;
    };
    StringBuilder.prototype = {
        append: function (obj) {
            if (typeof obj !== 'string') {
                obj = obj.toString();
            }
            this.array.push(obj);
            this.length += obj.length;
            return this;
        },
        toString: function () {
            return this.array.join('');
        },
        clear: function () {
            this.array = [];
            this.length = 0;
            return this;
        }
    };
    StringBuilder.prototype.write = StringBuilder.prototype.append;
    return StringBuilder;
});
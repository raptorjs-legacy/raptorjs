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
define('raptor/regexp', function (require) {
    'use strict';
    var simpleSpecial = {
            '*': '.*?',
            '?': '.?'
        };
    return {
        escape: function (str) {
            return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
        },
        simple: function (str) {
            var _this = this;
            return new RegExp('^' + str.replace(/[\*\?]|[^\*\?]*/g, function (match) {
                return simpleSpecial[match] || _this.escape(match);
            }) + '$');
        }
    };
});
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

/**
 * Defines a "parse" function that can be pulled in using require.
 * 
 * Example:
 * <js>
 * var parse = require('raptor/json/parse');
 * var o = parse("{'hello':'world'}");
 * </js>
 * 
 * The Raptor parse is more forgiving than the builtin JSON.parse function
 * will accept any JavaScript object and it will allow single quotes for strings.
 * The JavaScript "eval" method is used to do the parsing.
 * 
 * @module
 */
define(
    'raptor/json/parse',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var NON_ASCII = /[^\x00-\x7F]/g,
            strings = require('raptor/strings'),
            unicodeEncode = strings.unicodeEncode; //Pick up the unicodeEncode method from the strings module

        var parse = function(s) {
            if (typeof s === 'string') {
                // Replace any non-ascii characters with their corresponding unicode sequence
                s = s.replace(NON_ASCII, function(c) {
                    return unicodeEncode(c);
                });

                return eval('(' + s + ')');
            } else {
                throw raptor.createError(new Error('String expected'));
            }
        };
        
        parse.parse = parse; //Added for backwards compatibility
        
        return parse;
    });
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
define('raptor/strings', ['raptor'], function (raptor, require) {
    'use strict';
    var EMPTY_STRING = '', trim = function (s) {
            return s ? s.trim() : EMPTY_STRING;
        }, StringBuilder = require('raptor/strings/StringBuilder'), varRegExp = /\$\{([A-Za-z0-9_\.]+)\}/g;
    return {
        compare: function (s1, s2) {
            return s1 < s2 ? -1 : s1 > s2 ? 1 : 0;
        },
        isEmpty: function (s) {
            return s == null || trim(s).length === 0;
        },
        length: function (s) {
            return s == null ? 0 : s.length;
        },
        isString: function (s) {
            return typeof s === 'string';
        },
        equals: function (s1, s2, shouldTrim) {
            if (shouldTrim !== false) {
                s1 = trim(s1);
                s2 = trim(s2);
            }
            return s1 == s2;
        },
        notEquals: function (s1, s2, shouldTrim) {
            return this.equals(s1, s2, shouldTrim) === false;
        },
        trim: trim,
        ltrim: function (s) {
            return s ? s.replace(/^\s\s*/, '') : EMPTY_STRING;
        },
        rtrim: function (s) {
            return s ? s.replace(/\s\s*$/, '') : EMPTY_STRING;
        },
        startsWith: function (s, prefix) {
            return s == null ? false : s.startsWith(prefix);
        },
        endsWith: function (s, suffix) {
            return s == null ? false : s.endsWith(suffix);
        },
        unicodeEncode: function (c) {
            return '\\u' + ('0000' + (+c.charCodeAt(0)).toString(16)).slice(-4);
        },
        merge: function (str, data) {
            var varMatches, replacement, parts = [], lastIndex = 0;
            varRegExp.lastIndex = 0;
            while (varMatches = varRegExp.exec(str)) {
                parts.push(str.substring(lastIndex, varMatches.index));
                replacement = data[varMatches[1]];
                parts.push(replacement !== undefined ? replacement : varMatches[0]);
                lastIndex = varRegExp.lastIndex;
            }
            parts.push(str.substring(lastIndex));
            return parts.join('');
        },
        StringBuilder: StringBuilder,
        createStringBuilder: function () {
            return new StringBuilder();
        }
    };
});
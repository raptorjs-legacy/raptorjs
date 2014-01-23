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
 * Defines a "stringify" function that can be pulled in using require.
 * 
 * Example:
 * <js>
 * var stringify = require('raptor/json/stringify');
 * var json = stringify({hello: "world"});
 * //Output: {"hello":"world"} 
 * </js>
 * 
 * The Raptor stringify function supports additional options not provided
 * by the builtin JSON object:
 * <b>special</b>: A regular expression to indicate "special" characters that must be escaped
 * <b>useSingleQuote</b>: If true, then single quotes will be used for strings instead of double quotes (helpful if the the string values contain a lot of double quotes)
 * 
 * @module
 */
define('raptor/json/stringify', ['raptor'], function (raptor, require, exports, module) {
    'use strict';
    var strings = require('raptor/strings'), unicodeEncode = strings.unicodeEncode,
        //Pick up the unicodeEncode method from the strings module
        COMMA = ',', NULL = 'null', ARRAY = Array, SPECIAL = /([^ -~]|(["'\\]))/g, REPLACE_CHARS = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '\\': '\\\\'
        }, _zeroPad = function (v) {
            return v < 10 ? '0' + v : v;
        }, encodeDate = function (d) {
            return d.getUTCFullYear() + '-' + _zeroPad(d.getUTCMonth() + 1) + '-' + _zeroPad(d.getUTCDate()) + 'T' + _zeroPad(d.getUTCHours()) + ':' + _zeroPad(d.getUTCMinutes()) + ':' + _zeroPad(d.getUTCSeconds()) + 'Z';
        };
    var stringify = function (o, options) {
        if (!options) {
            options = {};
        }
        var specialRegExp = options.special || SPECIAL;
        var buffer = strings.createStringBuilder(), append = function (str) {
                buffer.append(str);
            }, useSingleQuote = options.useSingleQuote === true, strChar = useSingleQuote === true ? '\'' : '"', encodeString = function (s) {
                return strChar + s.replace(specialRegExp, function (c) {
                    if (c === '"') {
                        return useSingleQuote ? '"' : '\\"';
                    } else if (c === '\'') {
                        return useSingleQuote ? '\\\'' : '\'';
                    }
                    var replace = REPLACE_CHARS[c];
                    return replace || unicodeEncode(c);
                }) + strChar;
            }, serialize = function (o) {
                if (o == null) {
                    append(NULL);
                    return;
                }
                var constr = o.constructor, i, len;
                if (o === true || o === false || constr === Boolean) {
                    append(o.toString());
                } else if (constr === ARRAY) {
                    append('[');
                    len = o.length;
                    for (i = 0; i < len; i++) {
                        if (i !== 0) {
                            append(COMMA);
                        }
                        serialize(o[i]);
                    }
                    append(']');
                } else if (constr === Date) {
                    append(encodeDate(o));
                } else {
                    var type = typeof o;
                    switch (type) {
                    case 'string':
                        append(encodeString(o));
                        break;
                    case 'number':
                        append(isFinite(o) ? o + '' : NULL);
                        break;
                    case 'object':
                        append('{');
                        var first = true, v;
                        for (var k in o) {
                            if (o.hasOwnProperty(k)) {
                                v = o[k];
                                if (v == null)
                                    continue;
                                if (first === false) {
                                    append(COMMA);
                                } else {
                                    first = false;
                                }
                                append(encodeString(k));
                                append(':');
                                serialize(v);
                            }
                        }
                        append('}');
                        break;
                    default:
                        append(NULL);
                    }
                }
            };
        serialize(o);
        return buffer.toString();
    };
    stringify.stringify = stringify;
    //Add stringify as a sub-property for backwards compatibility
    return stringify;
});
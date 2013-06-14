/*
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
 * The Dictionary class provides lookup methods for retrieving values from a dictionary.
 */
define.Class('raptor/i18n/Dictionary', function(require, exports, module) {
    "use strict";

    function Dictionary(dictionary) {
        this._dictionary = dictionary;
    }

    /*
     * This map defines handlers for values that are not simple strings.
     */
    var handlers = {
        dust: function(key, rawValue, substitutions) {
            dust.render(key, substitutions, function(err, out) {
                if (err) {
                    throw err;
                } else {
                    return out;
                }
            });
        }
    }

    Dictionary.prototype = {
        /**
         * This method will lookup a value from the dictionary.
         * If no value is found then undefined is returned.
         * Use $get if you'd like the key returned wrapped with "$$$"
         * if the value does not exist.
         *
         * @param key the name of the property to look up
         * @param substitution an optional JavaScript object that contains values for placeholders in a template
         *      (this argument is ignored if the value is not a template)
         * @return the value for the given key or undefined if dictionary does not contain value for given key
         */
        getIfExists: function(key, substitutions) {
            var rawValue = this._dictionary[key];
            if (rawValue === undefined) {
                return undefined;
            }

            if (rawValue.constructor === String) {
                return rawValue;
            } else if (rawValue.type !== undefined) {
                var handler = handlers[rawValue.type];
                if (handler) {
                    return handler(key, rawValue, substitutions);
                }
            }

            return rawValue;
        },

        /**
         * This method will lookup a value from the dictionary.
         * If no value is found then the key wrapped with "$$$" is returned.
         * Use get if you'd like undefined returned if the value does not exist.
         *
         * @param key the name of the property to look up
         * @param substitution an optional JavaScript object that contains values for placeholders in a template
         *      (this argument is ignored if the value is not a template)
         * @return the value for the given key or the key wrapped with "$$$" if dictionary does not contain value for given key
         */
        get: function(key, substitutions) {
            var value = this.getIfExists(key, substitutions);
            return (value === undefined) ? '$$$' + key + '$$$': value;
        }
    }

    return Dictionary;
})
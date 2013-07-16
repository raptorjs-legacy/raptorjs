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
 define('raptor/optimizer/i18n/i18n-compiler', function(raptor, exports, module) {
    "use strict";

    var i18n = require('raptor/i18n');

    var specialTypes = {

        // built-in type that is used to remove comment keys
        'comment': function(key, value, dictionary, writer) {
            delete dictionary[key];
        },

        // built-in type is used to compile Dust templates
        'template': function(key, value, dictionary, writer) {
            if (Array.isArray(value)) {
                value = value.join('');
            }

            var dust = require('dustjs-linkedin');
            writer.write(dust.compile(value, key));
            dictionary[key] = {
                type: 'dust'
            };
        }
    };

    return {

        /**
         * Adds a new property compiler for keys that have the given extension.
         * The given compiler function is invoked when keys with the given
         * extension are encountered during the dictoinary compilation phase.
         *
         * @param specialTypeExtension {String} the extension of the key (e.g. "comment")
         * @param
         */
        addSpecialtype: function(specialTypeExtension, specialTypeCompiler) {
            specialTypes[specialTypeExtension] = specialTypeCompiler;
        },

        /**
         * This function compiles the given dictionary (a JavaScript object read
         * from a JSON document). The compilation phase handles tasks such as
         * removing comments and compiling templates.
         *
         * @param name {String} name of the dictionary (e.g. "my-app/MyApp")
         * @param localeCode {String} the locale code of the dictionary (e.g. "en_US")
         * @param dictionary {Object} the dictionary
         * @param writer an object that provides a "write" method that can be used to write resulant JavaScript code
         */
        compileDictionary: function(name, localeCode, dictionary, writer) {
            var keys = Object.keys(dictionary);

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i],
                    value = dictionary[key],
                    pos = key.lastIndexOf('.');
                if (pos !== -1) {
                    var type = specialTypes[key.substring(pos+1)];
                    if (type !== undefined) {
                        type(key, value, dictionary, writer);
                    } else {
                        // the default handler will automatically join arrays to form a single String
                        if (Array.isArray(value)) {
                            dictionary[key] = value.join('');
                        }
                    }
                }
            }

            writer.write('$rset("i18n-module", ');
            writer.write(JSON.stringify(i18n.getDictionaryName(name, localeCode)));
            writer.write(', ');
            writer.write(JSON.stringify(dictionary, null, ' '));
            writer.write(');');
        }
    };
 });
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
    'use strict';

    var i18n = require('raptor/i18n'),
        logger = module.logger();

    return {

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

            logger.info('Compiling dictionary "' + name + '" for locale "' + localeCode + '"...');

            // TODO: Remove Dust because it's not a good template compiler
            writer.write('var dust = window.dust;\n');
            
            i18n.compileDictionary(name, localeCode, dictionary, writer);

            writer.write('$rset("i18n-module", ');
            writer.write(JSON.stringify(i18n.getDictionaryName(name, localeCode)));
            writer.write(', ');
            writer.write(JSON.stringify(dictionary, null, ' '));
            writer.write(');');

            logger.info('Finished compiling dictionary "' + name + '" for locale "' + localeCode + '".');
        }
    };
 });
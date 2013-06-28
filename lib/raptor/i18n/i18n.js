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
define('raptor/i18n', function(require, exports, module) {
    "use strict";

    function normalizeLocaleCode(localeCode) {
        if (localeCode.charAt(2) === '-') {
            return localeCode.replace('-', '_');
        } else {
            return localeCode;
        }
    }
    return {
        getI18nModuleName: function(localeCode) {
            return (localeCode === '') ? 'i18n' : 'i18n-' + localeCode;
        },

        getDictionaryName: function(name, localeCode) {
            return name + '_' + localeCode;
        },

        /**
         * Loads the dictionaries for the given locale
         *
         * @param localeCode the locale code for which to load dictionaries
         * @ param callback Node-style callback function
         */
        loadLocale: function(localeCode, callback) {
            require([this.getI18nModuleName(localeCode)], function() {
                var Dictionaries = require('raptor/i18n/Dictionaries');
                callback(new Dictionaries(localeCode));
            });
        },

        /**
         * The method will return the most appropriate locale based on the
         * end-user's locale preference and available locales. This method will
         * handle both the "_" and "-" separator characters equally well.
         *
         * @param preferredLocale an array of locales (e.g. ['en', 'en_US'])
         *  or a string in the format of the Accept-Language header value
         *  (e.g. "en-US,en;q=0.8")
         *
         * @param availableLocales an array of locale codes
         *  (e.g. ["en", "en_US", ])
         *
         * @return the item in the availableLocales that is a best match or
         *  the empty string to indicate default locale
         */
        findBestLocale: function(preferredLocale, availableLocales) {
            if (!preferredLocale) {
                // use default locale
                return '';
            }

            if (!availableLocales) {
                // assume default locale because availableLocales is not an array
                return '';
            }

            var localeMap = {};
            for (var i = 0; i < availableLocales.length; i++) {
                localeMap[normalizeLocaleCode(availableLocales[i])] = true;
            }

            var candidates;
            if (Array.isArray(preferredLocale)) {
                candidates = preferredLocale;
            } else {
                if (preferredLocale.indexOf(',') === -1) {
                    candidates = [preferredLocale];
                } else {
                    candidates = preferredLocale.split(',');
                }
            }

            for (var j = 0; j < candidates.length; j++) {

                preferredLocale = candidates[j];

                // chop off part past ';' if it exists
                var pos = preferredLocale.indexOf(';');
                if (pos !== -1) {
                    preferredLocale = preferredLocale.substring(0, pos);
                }

                // normalize separator
                preferredLocale = normalizeLocaleCode(preferredLocale);

                if (localeMap[preferredLocale]) {
                    return preferredLocale;
                }

                if (preferredLocale.charAt(2) === '_') {
                    preferredLocale = preferredLocale.substring(0, 2);
                    if (localeMap[preferredLocale]) {
                        return preferredLocale;
                    }
                }
            }

            return '';
        }
    };
})
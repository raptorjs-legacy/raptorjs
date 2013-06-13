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
 * The Dictionaries class manages dictionaries for a given locale.
 * Dictionaries for multiple locales can be loaded but the resources
 * for a single locale or accessed via a Dictionaries instance.
 */
define.Class('raptor/i18n/Dictionaries', function(require, exports, module) {
    "use strict";

    var i18n = require('raptor/i18n');
    var Dictionary = require('raptor/i18n/Dictionary');

    function Dictionaries(localeCode) {
        this._localeCode = localeCode || '';
        this._dictionaryByName = {};
    }

    Dictionaries.prototype = {

        resolveDictionary: function(name) {
            var dictionary = $rget('i18n-module', i18n.getDictionaryName(name, this._localeCode));
            if (!dictionary) {
                throw new Error('Dictionary "' + name + '" not found for locale "' + this._localeCode + '"');
            }
            return dictionary;
        },

        getDictionary: function(name) {
            var dictionary = this._dictionaryByName[name];
            if (!dictionary) {
                // wrap the raw dictionary (a plain JavaScript object) with an instance of Dictionary
                this._dictionaryByName[name] = dictionary = new Dictionary(this.resolveDictionary(name));
            }
            return dictionary;
        }
    }

    return Dictionaries;
})
define.extend('raptor/i18n', function (require, exports, modules) {
    return {
        loadLocale: function (localeCode, callback) {
            // use the asynchronous loader to load the locale
            require([this.getI18nModuleName(localeCode)], function () {
                var Dictionaries = require('raptor/i18n/Dictionaries');
                callback(null, new Dictionaries(localeCode));
            });
        },
        resolveDictionary: function (name, dictionaries) {
            var localeCode = dictionaries.getLocaleCode();
            var dictionary = $rget('i18n-module', this.getDictionaryName(name, localeCode));
            if (!dictionary) {
                return null;
            }
            var Dictionary = require('raptor/i18n/Dictionary');
            dictionary = new Dictionary(name, dictionary, localeCode);
            dictionaries.setDictionary(name, dictionary);
            return dictionary;
        },
        renderDustTemplate: function (templateName, input) {
            var _out;
            dust.render(templateName, input, function (err, out) {
                if (err) {
                    throw err;
                } else {
                    _out = out;
                }
            });
            return _out;
        }
    };
});
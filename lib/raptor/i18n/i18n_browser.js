define.extend('raptor/i18n', function(require, exports, modules) {

    return {
        /**
         * Loads the dictionaries for the given locale.
         * Asynchronous i18n modules are automatically created during the build process.
         * These modules are named according to well-known convention. This method
         * will load the i18n module for the given locale using the asynchronous
         * loader.
         *
         * @param localeCode the locale code for which to load dictionaries
         * @param callback Node-style callback function
         */
        loadLocale: function(localeCode, callback) {
            // use the asynchronous loader to load the locale
            require([this.getI18nModuleName(localeCode)], function() {
                var Dictionaries = require('raptor/i18n/Dictionaries');
                callback(null, new Dictionaries(localeCode));
            });
        },

        resolveDictionary: function(name, localeCode) {
            var dictionary = $rget('i18n-module', this.getDictionaryName(name, localeCode)),
                Dictionary = require('raptor/i18n/Dictionary');
            return new Dictionary(name, dictionary, localeCode);
        },

        renderDustTemplate: function(templateName, input) {
            dust.render(templateName, input, function(err, out) {
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
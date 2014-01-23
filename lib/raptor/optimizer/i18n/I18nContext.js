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
 * The i18n context gets put into the raptor PageOptimizer context to keep track of
 * all of the i18n resources that have been found.
 *
 * The developer should only include the resource for the default locale as a
 * dependency in the package.json.
 *
 * For example, the dependency might be:
 * {"type": "i18n", "path": "DatePicker.i18n.json"}
 *
 * The supported locale codes are also put inside the i18n context during configuration
 * of the page optimizer when localization is enabled. The localized resource for each
 * i18n dependency is automatically found by iterating through the list of enabled
 * locales.
 */
define.Class('raptor/optimizer/i18n/I18nContext', function (require, exports, module) {
    'use strict';
    var packaging = require('raptor/packaging');
    var i18n = require('raptor/i18n');
    var extend = require('raptor').extend;
    var logger = module.logger();
    var I18nContext = function (config) {
        this._dependencies = [];
        this._locales = config.locales || [];
        this._dictionariesByLocaleMap = { '': {} };
        // store locales in sorted order so that we can ensure that
        // locales are loaded in order of specificity (starting from default)
        this._locales.sort(function (c1, c2) {
            return c1.localeCompare(c2);
        });
        // initialize lookup table for finding dictionaries for each enabled locale
        for (var i = 0; i < this._locales.length; i++) {
            this._dictionariesByLocaleMap[this._locales[i]] = {};
        }
    };
    function errorsToString(errors) {
        var message = [];
        for (var i = 0; i < errors.length; i++) {
            var error = errors[i];
            if (error.resource) {
                message.push('Error reading i18n resource ' + error.resource.getPath() + '. ' + error.toString());
            } else {
                message.push(error.toString());
            }
        }
        return message.join('\n');
    }
    I18nContext.prototype = {
        getLocales: function () {
            return this._locales;
        },
        getDictionariesForLocale: function (localeCode) {
            return this._dictionariesByLocaleMap[localeCode];
        },
        getDictionary: function (name, localeCode) {
            var dictionaries = this.getDictionariesForLocale(localeCode);
            return dictionaries[name];
        },
        setDictionary: function (name, localeCode, dictionary) {
            var dictionaries = this.getDictionariesForLocale(localeCode);
            dictionaries[name] = dictionary;
        },
        forEachDictionary: function (localeCode, callback) {
            var dictionaries = this.getDictionariesForLocale(localeCode);
            if (!dictionaries) {
                return;
            }
            for (var name in dictionaries) {
                callback(name, dictionaries[name]);
            }
        },
        compileDictionaries: function (localeCode) {
            var compiler = require('raptor/optimizer/i18n/i18n-compiler');
            var code = [];
            var writer = {
                    write: function (data) {
                        code.push(data);
                    }
                };
            this.forEachDictionary(localeCode, function (name, dictionary) {
                code.push(compiler.compileDictionary(name, localeCode, dictionary, writer));
            });
            return code.join('');
        },
        _readDictionaryResource: function (i18nResource, localeCode, callback, thisObj) {
            i18n.readI18nResource(i18nResource, localeCode, function (err, dictionary) {
                if (err) {
                    return callback.call(thisObj || this, err);
                }
                // get the dictionaries map for given locale
                var dictionaries = this._dictionariesByLocaleMap[localeCode];
                // store reference to new dictionary using the original dependency resource path as key
                dictionaries[i18nResource.getDictionaryName()] = dictionary;
                // done
                callback.call(thisObj || this, null, dictionary);
            }, this);
        },
        _rollUpDictionaries: function (i18nResource) {
            var parentDictionary, dictionaryName = i18nResource.getDictionaryName(),
                // The default dictionary is the JSON document provided by the developer
                defaultDictionary = this.getDictionary(dictionaryName, '');
            // for each locale
            for (var i = 0; i < this._locales.length; i++) {
                var localeCode = this._locales[i], dictionary = this.getDictionary(dictionaryName, localeCode);
                if (dictionary === undefined) {
                    if (localeCode === '$$') {
                        dictionary = {};
                        this.setDictionary(dictionaryName, localeCode, dictionary);
                    } else {
                        // There is no translated dictionary for this locale so use the dictionary provided by default locale
                        this.setDictionary(dictionaryName, localeCode, extend({}, defaultDictionary));
                        // since we're using the default don't need to do roll up
                        continue;
                    }
                }
                parentDictionary = localeCode.charAt(2) === '_' ? this.getDictionary(dictionaryName, localeCode.substring(0, 2)) : undefined;
                for (var key in defaultDictionary) {
                    if (defaultDictionary.hasOwnProperty(key)) {
                        if (localeCode === '$$') {
                            dictionary[key] = '$' + key + '$';
                        } else {
                            if (dictionary[key] === undefined) {
                                if (parentDictionary) {
                                    dictionary[key] = parentDictionary[key] || defaultDictionary[key];
                                } else {
                                    dictionary[key] = defaultDictionary[key];
                                }
                            }
                        }
                    }
                }
            }
        },
        _readI18nDependency: function (dependency, callback) {
            logger.debug('Found i18n dependency "' + dependency.name + '".');
            var self = this, i18nResource = dependency.getI18nResource(), locales = this.getLocales();
            // we need to read the dictionary for each user-defined locale plus the default locale
            var pending = locales.length + 1, errors;
            function onReadDictionary(err) {
                pending--;
                if (err) {
                    if (errors === undefined) {
                        errors = [];
                    }
                    errors.push(err);
                }
                if (pending === 0) {
                    if (errors) {
                        callback(errorsToString(errors));
                    } else {
                        self._rollUpDictionaries(i18nResource);
                        callback(null);
                    }
                }
            }
            // read dictionary for default locale
            this._readDictionaryResource(i18nResource, '', onReadDictionary, this);
            // find localized dictionaries for each locale
            for (var i = 0; i < locales.length; i++) {
                this._readDictionaryResource(i18nResource, locales[i], onReadDictionary, this);
            }
        },
        buildBundles: function (pageBundles, callback) {
            if (this._dependencies.length === 0) {
                // short-circuit if there are no  i18n dependencies
                callback();
                return;
            }
            // When this method is called, _dependencies will contain an array
            // of all if the i18n dependencies that were referenced from package manifests.
            // We should read these JSON files and build rolled-up dictionaries for
            // all of the locales.
            var packages = [];
            var bundleMappings = pageBundles.bundleMappings;
            var locales = [''].concat(this.getLocales());
            var async = true;
            var i;
            var localesDisplayStr = '"' + locales.join('", "') + '"';
            logger.info('Building localization bundles for following locales: ' + localesDisplayStr + '...');
            // Loop through each supported locale and inject a package for
            // each locale that has a single i18n-module dependency.
            // Also, read the contents of all of the resources (which should
            // be a dictionary) and associate those dictionaries with the locale
            for (i = 0; i < locales.length; i++) {
                var localeCode = locales[i];
                // the bundle name is chosen by convention
                var bundleName = i18n.getI18nModuleName(localeCode);
                // create the parent package manifest
                var packageManifest = packaging.createPackageManifest({
                        async: async,
                        name: bundleName,
                        raptor: {
                            dependencies: [{
                                    key: bundleName,
                                    type: 'i18n-module',
                                    locale: localeCode,
                                    i18n: this
                                }]
                        }
                    });
                // each package has a single dependency which is the i18n-module
                bundleMappings.addDependencyToBundle(packageManifest.getDependencies()[0], bundleName);
                // add manifest to list of packages because these get returned via the deferred data
                packages.push(packageManifest);
            }
            var pending = this._dependencies.length;
            var errors;
            /*
             * This callback is called every time an i18n dependency is fully read.
             */
            function onReadDependency(err) {
                pending--;
                if (err) {
                    if (errors === undefined) {
                        errors = [];
                    }
                    errors.push(err);
                }
                if (pending === 0) {
                    logger.info('Done building localization bundles for following locales: ' + localesDisplayStr);
                    if (errors) {
                        callback(errorsToString(errors));
                    } else {
                        callback(null, { packages: packages });
                    }
                }
            }
            for (i = 0; i < this._dependencies.length; i++) {
                this._readI18nDependency(this._dependencies[i], onReadDependency);
            }
        },
        addDependency: function (dependency) {
            this._dependencies.push(dependency);
        }
    };
    return I18nContext;
});
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
define.Class('raptor/optimizer/i18n/I18nContext', function(require, exports, module) {
    "use strict";

    //var resources = require('raptor/resources');
    var BundleConfig = require('raptor/optimizer/BundleConfig'),
        packaging = require('raptor/packaging'),
        resources = require('raptor/resources'),
        i18n = require('raptor/i18n'),
        logger = module.logger();
    
    var I18nContext = function(config) {
        this._dependencies = [];
        this._locales = config.locales || [];
        this._dictionariesByLocaleMap = {
            '': {}
        };

        // store locales in sorted order so that we can ensure that
        // locales are loaded in order of specificity (starting from default)
        this._locales.sort(function(c1, c2) {
            return c1.localeCompare(c2);
        });

        // initialize lookup table for findining dictionaries for each enabled locale
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

        getLocales: function() {
            return this._locales;
        },

        getDictionariesForLocale: function(localeCode) {
            return this._dictionariesByLocaleMap[localeCode];
        },

        getDictionary: function(name, localeCode) {
            var dictionaries = this.getDictionariesForLocale(localeCode);
            return dictionaries[name];
        },

        setDictionary: function(name, localeCode, dictionary) {
            var dictionaries = this.getDictionariesForLocale(localeCode);
            dictionaries[name] = dictionary;
        },

        addBundleConfigs: function(bundleSetConfig) {
            /*
            var locales = this._locales;

            // create a bundle for each locale
            for (var i = 0; i < locales.length; i++) {
                var name = 'i18n-' + locales[i];

                var bundle = new BundleConfig();
                bundle.name = name;

                // dependencies get mapped to the bundle during "build" call of PageBundles.js
                bundleSetConfig.addChild(bundle);
            }
            */
        },

        forEachDinctionary: function(localeCode, callback) {
            var dictionaries = this.getDictionariesForLocale(localeCode);
            if (!dictionaries) {
                return;
            }

            for (var name in dictionaries) {
                callback(name, dictionaries[name]);
            }
        },

        /**
         * @return JavaScript code of the compiled dictionaries for this locale
         */
        compileDictionaries: function(localeCode) {
            var compiler = require('raptor/optimizer/i18n/i18n-compiler');

            var code = [];

            var writer = {
                write: function(data) {
                    code.push(data);
                }
            }
            
            this.forEachDinctionary(localeCode, function(name, dictionary) {
                code.push(compiler.compileDictionary(name, localeCode, dictionary, writer));
            });

            return code.join('');
        },

        _readDictionaryResource: function(resource, localeCode, dependency, callback) {
            var json = resource.readAsString('UTF-8');
            var dictionary;
            try {
                dictionary = JSON.parse(json);
            } catch(e) {
                // store reference to resource in error object
                e.resource = resource;

                // invoke callback with error
                callback(e);
                return;
            }

            // get the dictionaries map for given locale
            var dictionaries = this._dictionariesByLocaleMap[localeCode];

            // store reference to new dictionary using the original dependency resource path as key
            dictionaries[dependency.name] = dictionary;

            // done
            callback();
        },

        /**
         * This function will automatically provide values for dictionary properties
         * whose translation is not available in a given locale but is available
         * in a less specific locale.
         * For example, if "sp_MX" is missing a translation then this method will try
         * to find the next best translation by searching "sp" and then default locale.
         */
        _rollUpDictionaries: function(dependency) {
            var parentDictionary,
                defaultDictionary = this.getDictionary(dependency.name, '');

            // for each locale
            for (var i = 0; i < this._locales.length; i++) {
                var localeCode = this._locales[i],
                    dictionary = this.getDictionary(dependency.name, localeCode);

                if (dictionary === undefined) {
                    if (localeCode === '$$') {
                        dictionary = {};
                        this.setDictionary(dependency.name, localeCode, dictionary);
                    } else {
                        this.setDictionary(dependency.name, localeCode, defaultDictionary);
                        continue;
                    }
                }
                
                parentDictionary = (localeCode.charAt(2) === '_')
                    ? this.getDictionary(dependency.name, localeCode.substring(0, 2))
                    : undefined;

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

        /**
         * This function will read and parse the resource associated with the
         * given dependency and find all localized versions of this resource and
         * and put them in memory so that they will be available to the i18n module
         * dependency during the compilation phase.
         *
         * @param dependency the i18n dependency
         * @param callback the callback that be invoked upon completion
         */
        _readI18nDependency: function(dependency, callback) {
            var self = this,
                resource = dependency.getResource(),
                resourcePath = resource.getPath(),
                locales = this.getLocales(),
                pos,

                // the file extension
                extension,

                // the base part of the path before the extension
                base;

            var slashPos = resourcePath.lastIndexOf(slashPos);

            pos = resourcePath.indexOf('.', (slashPos === -1) ? 0 : slashPos + 1);
            if (pos === -1) {
                extension = '';
                base = resourcePath;
            } else {
                base = resourcePath.substring(0, pos);
                extension = resourcePath.substring(pos);
            }

            if (!dependency.name) {
                // use base part of the dependency resource path
                dependency.name = base.charAt(0) === '/' ? base.substring(1) : base;
            }

            logger.debug('Found i18n dependency ' + dependency.name);
            
            // we need to read the dictionary for each user-define locale plus the default locale
            var pending = locales.length + 1;
            var errors;

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
                        callback(new Error(errorsToString(errors)));
                    } else {
                        self._rollUpDictionaries(dependency);
                        callback(null);
                    }
                }
            }

            // read dictionary for default locale
            this._readDictionaryResource(resource, '', dependency, onReadDictionary);

            // find localized dictionaries for each locale
            for (var i = 0; i < locales.length; i++) {
                var localeCode = locales[i];
                var localizedResourcePath = base + '_' + localeCode + extension;
                var localizedResource = resources.findResource(localizedResourcePath);
                if (localizedResource.exists()) {
                    // read the dictionary/JSON file
                    this._readDictionaryResource(localizedResource, localeCode, dependency, onReadDictionary)
                } else {
                    // no dictionary for this locale but we need to decrement pending
                    onReadDictionary();
                }
            }
        },

        /**
         * This method is used by PageBundles to create i18n-modules for each supported locale
         */
        buildBundles: function(pageBundles, callback) {
            if (this._dependencies.length === 0) {
                // short-circuit if there are no  i18n dependencies
                callback();
                return;
            }

            // When this method is called, _dependencies will contain an array
            // of all if the i18n dependencies that were referenced from package manifests.
            // We should read these JSON files and build rolled-up dictionaries for
            // all of the locales.
            var self = this,
                packages = [],
                bundleMappings = pageBundles.bundleMappings,
                locales = [''].concat(this.getLocales());

            // Loop through each supported locale and inject a package for
            // each locale that has a single i18n-module dependency.
            // Also, read the contents of all of the resources (which should
            // be a dictionary) and associate those dictionaries with the locale
            for (var i = 0; i < locales.length; i++) {
                var localeCode = locales[i];

                // the bundle name is chosen by convention
                var bundleName = i18n.getI18nModuleName(localeCode);

                // create the parent package manifest
                var packageManifest = packaging.createPackageManifest({
                    name: bundleName,
                    raptor: {
                        dependencies: [
                            {
                                key: bundleName,
                                type: 'i18n-module',
                                locale: localeCode,
                                i18n: this
                            }
                        ]
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
                    if (errors) {
                        callback(new Error(errorsToString(errors)));
                    } else {
                        callback(null, {
                            asyncPackages: packages
                        });
                    }
                }
            }

            
            for (var i = 0; i < this._dependencies.length; i++) {
                this._readI18nDependency(this._dependencies[i], onReadDependency);
            }
        },

        addDependency: function(dependency) {
            this._dependencies.push(dependency);
        }
    };
    
    return I18nContext;
})
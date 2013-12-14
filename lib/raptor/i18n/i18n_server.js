define.extend('raptor/i18n', function(require, exports, module) {

    var raptor = require('raptor'),
        packaging = require('raptor/packaging'),
        resources = require('raptor/resources'),
        logger = require('raptor/logging').logger('raptor/i18n'),

        // cache of dictionaries by their locale code
        dictionariesByLocaleCodeCache = require('raptor/caching').getDefaultProvider().getCache('raptor/i18n.dictionariesByLocaleCode'),

        dictionaryByName = {},

        i18nResourceByURL = {},

        specialTypes = {
            // built-in type that is used to remove comment keys
            'comment': function(key, value, localeCode, dictionary, dictionaryName, writer) {
                delete dictionary[key];
            },

            // built-in type is used to compile Dust templates
            'template': function(key, value, localeCode, dictionary, dictionaryName, writer) {
                if (Array.isArray(value)) {
                    value = value.join('');
                }

                var dust = require('dustjs-linkedin'),
                    templateName = dictionaryName + '_' + localeCode + '.' + key;

                require('dustjs-helpers');

                try {
                    writer.write(dust.compile(value, templateName));
                } catch(e) {
                    logger.error('Error compiling template "' + value + '".', e);
                }

                logger.info('Compiled Dust template "' + templateName + '".');

                dictionary[key] = {
                    type: 'dust',
                    templateName: templateName
                };
            }
        };

    function I18nResource(resourcePath) {
        this._path = resourcePath;

        var slashPos = resourcePath.lastIndexOf('/'),
            pos = resourcePath.indexOf('.', (slashPos === -1) ? 0 : slashPos + 1);

        if (pos === -1) {
            // there is no file extension
            this._fileExtension = '';
            this._fileBasePath = resourcePath;
        } else {
            // there is a file extension so split the path at the first period after the last slash
            this._fileBasePath = resourcePath.substring(0, pos);
            this._fileExtension = resourcePath.substring(pos);
        }

        if (!this._dictionaryName) {
            // use base part of the this resource path
            this._dictionaryName = (this._fileBasePath.charAt(0) === '/') ? this._fileBasePath.substring(1) : this._fileBasePath;
        }

        this._rawDictonaryByLocaleCode = {};
    }

    I18nResource.prototype.getDictionaryName = function() {
        return this._dictionaryName;
    };

    I18nResource.prototype.getLocalizedResourcePath = function(localeCode) {
        if (localeCode) {
            return this._fileBasePath + '_' + localeCode + this._fileExtension;
        } else {
            return this._fileBasePath + this._fileExtension;
        }
    };

    function Writer() {
        this.code = [];
    }

    Writer.prototype.write = function(data) {
        this.code.push(data);
    };

    return {

        setSupportedLocales: function(localeCodes) {
            var localeCode;
            this._supportedLocalesByCode = {};
            for (var i = 0; i < localeCodes.length; i++) {
                localeCodes[i] = localeCode = this.normalizeLocaleCode(localeCodes[i]);
                this._supportedLocalesByCode[localeCode] = true;
            }
            this._supportedLocales = localeCodes;
        },

        /**
         * @param localeCode a normalized locale code
         */
        isLocaleSupported: function(localeCode) {
            return (localeCode === '') || (this._supportedLocalesByCode && this._supportedLocalesByCode[localeCode]);
        },

        createI18nResource: function(resourcePath) {
            return new I18nResource(resourcePath);
        },

        toI18nResource: function(obj) {
            if (obj.constructor === String) {
                return this.createI18nResource(obj + '.i18n.json');
            } else {
                return obj;
            }
        },

        _findI18nDependencies: function(moduleName, callback, thisObj) {
            var walker = packaging.createDependencyWalker(),
                dependencies = [],
                Dependency_i18n = require('raptor/packaging/Dependency_i18n');

            logger.info('Searching for i18n dependencies for module "' + moduleName + '"...');

            walker.walkModule(moduleName)

                .onDependency(function(dependency, extension) {
                    if (this.hasManifest(dependency)) {
                        // dependency represents a package or module so recurse into it
                        this.walkManifest(dependency);
                    } else {
                        if (dependency.constructor === Dependency_i18n) {
                            dependencies.push(dependency);
                        }
                    }
                })

                .onError(function(err) {
                    logger.error('Error reading i18n dependencies for module "' + moduleName + '".', err);
                })

                .onComplete(function() {

                    logger.info('Found ' + dependencies.length + ' i18n dependencies for module "' + moduleName + '".');

                    callback.call(thisObj || this, null, dependencies);
                })

                .start();
        },

        readI18nResource: function(i18nResource, localeCode, callback, thisObj) {
            if (thisObj === undefined) {
                thisObj = this;
            }
            
            var resourcePath = i18nResource.getLocalizedResourcePath(localeCode);
            var resource = resources.findResource(resourcePath);
            if (!resource.exists()) {
                logger.warn('Dictionary "' + resourcePath + '" not found for locale "' + localeCode + '". Using empty dictionary.');
                return callback.call(thisObj, null, {});
            }

            if (logger.isInfoEnabled()) {
                logger.info('Reading i18n dictionary from "' + resource.getPath() + '"...');
            }

            var json = resource.readAsString('UTF-8');
            var dictionary;
            try {
                dictionary = JSON.parse(json);
                if (logger.isInfoEnabled()) {
                    logger.info('Read i18n dictionary from "' + resource.getPath() + '".');
                }
            } catch(e) {
                // Deleting stack trace because it is not helpful
                delete e.stack;
                var error = raptor.createError('Error parsing JSON dictionary "' + resource.getPath() + '".', e);
                // store reference to resource in error object
                error.resource = i18nResource;
                throw error;
            }

            if (callback) {
                callback.call(thisObj, null, dictionary);
            }

            return dictionary;
        },

        getDictionariesForLocale: function(localeCode) {
            var dictionaries = dictionariesByLocaleCodeCache.get(localeCode);
            if (!dictionaries) {
                logger.info('Created new Dictionaries instance for locale "' + localeCode + '".');

                var Dictionaries = require('raptor/i18n/Dictionaries');
                dictionariesByLocaleCodeCache.put(localeCode, (dictionaries = new Dictionaries(localeCode)));
            }
            return dictionaries;
        },

        _eval: function(code, i18nResource, localeCode) {
            eval(code);
        },

        _loadDictionaryHelper: function(i18nResource, localeCode, parentDictionary) {
            var dictionaries = this.getDictionariesForLocale(localeCode),
                dictionaryName = i18nResource.getDictionaryName();

            var dictionary = dictionaries.getDictionaryIfLoaded(dictionaryName);
            if (dictionary) {
                logger.info('Found cached dictionary "' + dictionaryName + '" for locale "' + localeCode + '".');
                return dictionary;
            }

            logger.info('Loading dictionary "' + dictionaryName + '" for locale "' + localeCode + '"...');

            var dictionaryObj = this.readI18nResource(i18nResource, localeCode);
            
            if (dictionaryObj) {
                var writer = new Writer();

                // require dust (necessary for server-side only)
                writer.write('var dust = require("dustjs-linkedin");');

                this.compileDictionary(dictionaryName, localeCode, dictionaryObj, writer);

                if (writer.code.length > 0) {
                    try {
                        this._eval(writer.code.join(''));
                    } catch(e) {
                        // log the error but don't rethrow it so that the application won't blow up
                        logger.error('Unable to load compiled dictionary "' + dictionaryName + '".', e);
                    }
                }

                if (parentDictionary) {
                    var parentDictionaryObj = parentDictionary.raw();
                    for (var key in parentDictionaryObj) {
                        if (!dictionaryObj.hasOwnProperty(key)) {
                            dictionaryObj[key] = parentDictionaryObj[key];
                        }
                    }
                }
            } else {
                
                if (parentDictionary) {
                    logger.info('No localized dictionary for "' + dictionaryName + '" for locale "' + localeCode + '" found. Using dictionary for locale "' + parentDictionary.getLocaleCode() + '".');
                    dictionaryObj = parentDictionary.raw();
                } else {
                    logger.info('No localized dictionary for "' + dictionaryName + '" for locale "' + localeCode + '" found. Using empty dictionary.');
                    dictionaryObj = {};
                }
                
            }

            var Dictionary = require('raptor/i18n/Dictionary');
            
            dictionary = new Dictionary(dictionaryName, dictionaryObj, localeCode);

            // store the newly loaded dictionary back in the dictionaries object
            dictionaries.setDictionary(dictionaryName, dictionary);

            logger.info('Loaded dictionary "' + dictionaryName + '" for locale "' + localeCode + '".');
            return dictionary;
        },

        loadDictionarySync: function(i18nResource, localeCode) {
            return this.loadDictionary(i18nResource, localeCode);
        },

        /**
         * @param {String} i18nResource the name of an I18n resource (e.g. "my-application/my-module/MyModule")
         * @param {String} localeCode a normalized locale code (e.g. "en_US")
         * @param {Function} callback a callback that will be called with the loaded dictionary (if not provided then dictionary will be returned)
         * @param {Object} thisObj the scope that will be used when invoking the given callback (optional)
         * @return {Dictionary}
         */
        loadDictionary: function(i18nResource, localeCode, callback, thisObj) {
            // make sure we are utilizing an I18nResource and not a String resource path
            i18nResource = this.toI18nResource(i18nResource);

            var dictionary,
                parentDictionary;


            if (localeCode) {
                // first load the default dictionary
                parentDictionary = this._loadDictionaryHelper(i18nResource, '', null /* parentDictionary */);

                // We've loaded the default dictionary... Is there another intermediate locale?
                var subLocaleCode;
                if ((localeCode.charAt(2) === '_') && this.isLocaleSupported(subLocaleCode = localeCode.substring(0, 2))) {
                    parentDictionary = this._loadDictionaryHelper(i18nResource, subLocaleCode, parentDictionary);
                }
            }

            // We're done loading all of the parent dictionaries so load the final dictionary
            dictionary = this._loadDictionaryHelper(i18nResource, localeCode, parentDictionary, callback, thisObj);

            if (callback) {
                callback.call(thisObj || null, null, dictionary);
            }
            return dictionary;
        },

        /**
         * @param {String} moduleName the name of the i18m moduleName
         * @param {String} localeCode a normalized locale code (e.g. "en_US")
         * @param {Function} callback an optional callback
         * @param {Object} thisObj the scope that will be used when invoking the given callback (optional)
         */
        loadDictionariesForModule: function(moduleName, localeCode, callback, thisObj) {
            this._findI18nDependencies(moduleName, function(err, dependencies) {
                for (var i = 0; i < dependencies.length; i++) {
                    this.loadDictionary(dependencies[i].getI18nResource(), localeCode);
                }

                logger.info('Finished loading dictionaries for module "' + moduleName + '" and locale "' + localeCode + '".');

                if (callback) {
                    callback.call(thisObj || this, null, this.getDictionariesForLocale(localeCode));
                }
            }, this);
        },

        resolveDictionary: function(name, dictionaries) {
            return this.loadDictionarySync(name, dictionaries.getLocaleCode());
        },

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
                    type;

                if (value && value.type) {
                    type = specialTypes;
                }
                var pos = key.lastIndexOf('.');
                if (pos !== -1) {
                    type = specialTypes[key.substring(pos+1)];
                    if (type !== undefined) {
                        type(key, value, localeCode, dictionary, name, writer);
                    } else {
                        // the default handler will automatically join arrays to form a single String
                        if (Array.isArray(value)) {
                            dictionary[key] = value.join('');
                        }
                    }
                }
            }
        },

        renderDustTemplate: function(templateName, input) {
            var dust = require('dustjs-linkedin'),
                _out;
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
define.Class(
    "raptor/optimizer/Config",
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var strings = require('raptor/strings'),
            BundleMappings = require('raptor/optimizer/BundleMappings'),
            promises = require('raptor/promises'),
            listeners = require('raptor/listeners'),

            // allow whitespace and comma to separate values (used for locales)
            localesSeparator = /(?:\s*,\s*|\s+)/;
        
        var Config = function(params) {
            this.configResource = null;
            this.outputDir = null;
            this.bundlingEnabled = true;
            this.checksumsEnabled = true;
            this.enabledProfiles = {};
            this.urlPrefix = null;
            this.enabledExtensions = require('raptor/packaging').createExtensionCollection();
            this.params = {};
            this.bundleSetConfigsByName = {};
            this.inPlaceDeploymentEnabled = false;
            this.serverSourceMappings = [];
            this.pageConfigs = [];
            this.pageConfigsByName = {};
            this.checksumLength = 8;
            this.filters = [];
            this.bundlingEnabled = true;
            this.minifyJs = false;
            this.minifyCss = false;
            this.basePath = null;
            this.writer = null;
            this.includeSlotNameForBundles = false;
            this.plugins = [];
            this.pluginsObservable = listeners.createObservable();
            this.enabledLocales = undefined;

            if (params) {
                raptor.extend(this.params, params);
            }
        };
        
        Config.prototype = {

            getPageConfig: function(name) {
                return this.pageConfigsByName[name];
            },

            setUrlPrefix: function(urlPrefix) {
                this.urlPrefix = urlPrefix;
            },

            addPlugin: function(pluginConfig) {
                var plugin;

                var module = pluginConfig.module;

                if (module) {
                    if (typeof module === 'string') {
                        module = require(module);
                    }

                    if (module.create) {
                        plugin = module.create(this);
                    }
                    else {
                        plugin = module;
                    }
                }

                for (var key in plugin) {
                    if (key.startsWith('on')) {
                        var message = key.substring(2);
                        message = message.charAt(0).toLowerCase() + message.substring(1);

                        this.pluginSubscribe(message, plugin[key], plugin);
                    }
                }

                this.plugins.push(plugin);
            },

            pluginSubscribe: function(message, callback, thisObj) {
                return this.pluginsObservable.subscribe(message, callback, thisObj);
            },

            notifyPlugins: function(message, eventArgs) {
                this.pluginsObservable.publish(message, eventArgs);
            },
            
            enableJSMinification: function() {
                this.addFilter("raptor/optimizer/MinifyJSFilter");
                console.error("enableJSMinification*****s");
            },

            enableCSSMinification: function() {
                this.addFilter("raptor/optimizer/MinifyCSSFilter");
            },

            enableResolveCSSUrlFilter: function() {
                this.addFilter("raptor/optimizer/ResolveCSSUrlsFilter");
            },

            addFilter: function(filter) {

                var filterFunc,
                    filterThisObj,
                    filterName,
                    filterContentType;

                if (typeof filter === 'string') {
                    filter = {
                        className: filter
                    };
                }

                if (typeof filter === 'function') {
                    
                }
                else if (typeof filter === 'object') {
                    if (filter.className) {
                        filterName = filter.className;
                        filter = require(filter.className);
                    }
                }
                else {
                    throw new Error("Invalid filter: " + filter);
                }

                if (typeof filter === 'function') {
                    var FilterClass = filter;
                    filter = new FilterClass();
                }

                filterFunc = filter.filter;
                filterContentType = filter.contentType;
                filterThisObj = filter;


                if (filterThisObj) {
                    filterFunc = filterFunc.bind(filterThisObj);
                }

                filterFunc._name = filterName || filter.name;
                filterFunc.contentType = filterContentType;

                // Check if the filter has already been added
                for (var i=0; i<this.filters.length; i++) {
                    if (this.filters[i] === filterFunc) {
                        return;
                    }
                }

                this.filters.push(filterFunc);
            },
            
            getFilters: function() {
                return this.filters;
            },
            
            setOutputDir: function(outputDir) {
                this.outputDir = outputDir;
            },
            
            isChecksumsEnabled: function() {
                return this.checksumsEnabled === true;
            },
            
            isInPlaceDeploymentEnabled: function() {
                return this.inPlaceDeploymentEnabled === true;
            },
            
            isBundlingEnabled: function() {
                return this.bundlingEnabled;
            },
            
            addServerSourceMapping: function(baseDir, urlPrefix) {
                this.serverSourceMappings.push({baseDir: baseDir, urlPrefix: urlPrefix});
            },
            
            hasServerSourceMappings: function() {
                return this.serverSourceMappings.length !== 0;
            },

            getServerSourceMappings: function() {
                return this.serverSourceMappings;
            },
            
            getUrlForSourceFile: function(sourceFilePath) {
                var path = require('path');


                for (var i=0, len=this.serverSourceMappings.length; i<len; i++) {

                    var mapping = this.serverSourceMappings[i];
                    
                    if (strings.startsWith(sourceFilePath, mapping.baseDir)) {
                        var relativePath = path.relative(mapping.baseDir, sourceFilePath);
                        if (!mapping.urlPrefix.endsWith('/') && !relativePath.startsWith('/')) {
                            relativePath = '/' + relativePath;
                        }

                        return mapping.urlPrefix + relativePath;
                    }
                }
                
                return null;
            },
            
            getParam: function(name) {
                return this.params[name];
            },
            
            getParams: function() {
                return this.params;
            },
            
            addParam: function(name, value) {
                if (this.params.hasOwnProperty(name)) {
                    return; //Params are only write-once
                }
                this.params[name] = value;
            },
            
            getUrlPrefix: function() {
                return this.urlPrefix;
            },

            getOutputDir: function() {
                return this.outputDir;
            },
            
            addBundleSetConfig: function(bundleSetConfig) {
                var BundleSetConfig = require('raptor/optimizer/BundleSetConfig');
                
                if (!(bundleSetConfig instanceof BundleSetConfig)) {
                    bundleSetConfig = new BundleSetConfig(bundleSetConfig);
                }
                
                if (!bundleSetConfig.name) {
                    bundleSetConfig.name = "default";
                }
                
                if (this.bundleSetConfigsByName[bundleSetConfig.name]) {
                    throw raptor.createError(new Error('Bundles with name "' + bundleSetConfig.name + '" defined multiple times'));
                }
                
                this.bundleSetConfigsByName[bundleSetConfig.name] = bundleSetConfig;
                
                return bundleSetConfig;
            },
            
            getBundleSetConfig: function(name) {
                return this.bundleSetConfigsByName[name];
            },

            enableExtension: function(name) {
                
                this.enabledExtensions.add(name);
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            setEnabledExtensions: function(enabledExtensions) {
                this.enabledExtensions = require('raptor/packaging').createExtensionCollection(enabledExtensions);
            },
            
            enableMinification: function() {
                this.enableJSMinification();
                this.enableCSSMinification();
            },
            
            enableProfile: function(profileName) {
                this.enabledProfiles[profileName] = true;
            },
            
            enableProfiles: function(profileNames) {
                if (typeof profileNames === 'string') {
                    profileNames = profileNames.split(/\s*[,;]\s*/);
                }
                raptor.forEach(profileNames, function(profileName) {
                    this.enableProfile(profileName);
                }, this);
            },
            
            setProfile: function(profileName) {
                this.enabledProfiles = {};
                this.enableProfile(profileName);
            },
            
            isProfileEnabled: function(profileName) {
                return this.enabledProfiles[profileName] === true;
            },
            
            registerPageConfig: function(pageConfig) {
                if (!pageConfig.name) {
                    throw raptor.createError(new Error('name is required for page'));
                }
                this.pageConfigs.push(pageConfig);
                this.pageConfigsByName[pageConfig.name] = pageConfig;
            },
            
            setConfigResource: function(configResource) {
                this.configResource = configResource;
            },
            
            getConfigResource: function() {
                return this.configResource;
            },
            
            getChecksumLength: function() {
                return this.checksumLength;
            },
            
            createBundleMappings: function(bundleSetConfig, context) {
                var BundleSetConfig = require('raptor/optimizer/BundleSetConfig'),
                    BundleConfig = require('raptor/optimizer/BundleConfig'),
                    bundleMappings = new BundleMappings(context);

                var config = this,
                    addBundles = function(o) {
                        var promise;

                        try
                        {
                            if (o.enabled === false) {
                                // No-op
                            }
                            else if (o.ref) {
                                var referencedBundleSetConfig = config.getBundleSetConfig(o.ref);
                                if (!referencedBundleSetConfig) {
                                    throw raptor.createError(new Error('Bundles not found with name "' + o.ref + '"'));
                                }
                                promise = addBundles(referencedBundleSetConfig);
                            }
                            else if (o instanceof BundleConfig) {
                                var bundleName = o.name;
                                
                                if (!bundleName) {
                                    throw raptor.createError(new Error("Illegal state. Bundle name is required"));
                                }
                                
                                promise = bundleMappings.addDependenciesToBundle(
                                    o.dependencies,
                                    bundleName,
                                    o.checksumsEnabled);
                            }
                            else if (o instanceof BundleSetConfig) {
                                var promiseChain = null;

                                o.forEachChild(function(child) {
                                    function addBundlesForChild() {
                                        return addBundles(child);
                                    }

                                    if (promiseChain) {
                                        promiseChain = promiseChain.then(addBundlesForChild);
                                    }
                                    else {
                                        promiseChain = addBundlesForChild();
                                    }
                                });

                                promise = promiseChain;
                            }

                            if (!promise) {
                                var deferred = promises.defer();
                                deferred.resolve();
                                promise = deferred.promise;
                            }

                            return promise;
                        }
                        catch(e) {
                            throw raptor.createError(new Error('Unable to build bundle mappings for "' + bundleSetConfig.name + '" in optimizer configuration.  Exception: ' + e), e);
                        }
    
                    };
                    
                var promise = addBundles(bundleSetConfig);
                var deferred = promises.defer();
                promise.then(function() {
                    deferred.resolve(bundleMappings);
                });
                return deferred.promise;
            },
                
            
            parseXml: function(xml, configFilePath) {
                var ConfigXmlParser = require('raptor/optimizer/ConfigXmlParser');
                var parser = new ConfigXmlParser();
                parser.parse(xml, configFilePath, this);
            },

            forEachPageConfig: function(callback, thisObj) {
                this.pageConfigs.forEach(callback, thisObj);
            },
            
            setChecksumsEnabled: function(checksumsEnabled) {
                this.checksumsEnabled = checksumsEnabled;
            },

            setInPlaceDeploymentEnabled: function(inPlaceDeploymentEnabled) {
                this.inPlaceDeploymentEnabled = inPlaceDeploymentEnabled;
            },
            
            getBasePath: function() {
                return this.basePath;
            },
            
            setBasePath: function(basePath) {
                this.basePath = basePath;
            },

            getWriter: function() {
                return this.writer;
            },

            setWriter: function(writer) {
                this.writer = writer;
            },

            addLocales: function(locales) {
                if (this.enabledLocales === undefined) {
                    this.enabledLocales = {};
                }
                
                if (!locales) {
                    return;
                }

                if (!Array.isArray(locales)) {
                    locales = locales.split(localesSeparator);
                }

                for (var i = 0; i < locales.length; i++) {
                    this.enabledLocales[locales[i]] = true;
                }
            },

            getLocales: function() {
                return this.enabledLocales ? Object.keys(this.enabledLocales) : undefined;
            }
        };
        
        return Config;
    });
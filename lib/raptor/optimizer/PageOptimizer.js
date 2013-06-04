var util = require('util');

define.Class(
    'raptor/optimizer/PageOptimizer',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var packaging = require('raptor/packaging'),
            Cache = require('raptor/optimizer/Cache'),
            OptimizerWriterMixins = require('raptor/optimizer/OptimizerWriterMixins'),
            OptimizerFileWriter = require('raptor/optimizer/OptimizerFileWriter'),
            FileUrlBuilder = require('raptor/optimizer/FileUrlBuilder'),
            OptimizedPage = require('raptor/optimizer/OptimizedPage'),
            SlotTracker = require('raptor/optimizer/SlotTracker'),
            File = require('raptor/files/File'),
            promises = require('raptor/promises'),
            escapeXmlAttr = require('raptor/xml/utils').escapeXmlAttr,
            logger = module.logger(),
            crypto = require('crypto'),
            forEach = raptor.forEach;
        
        var PageOptimizer = function(config) {
            if (!config) {
                throw new Error('config is required');
            }

            this.config = config;
            this.cacheLookup = {};
            this.cacheProvider = config.cacheProvider || require('raptor/caching').getDefaultProvider();

            this.config.notifyPlugins('pageOptimizerConfigured', {
                config: this.config,
                pageOptimizer: this
            });
        };
        
        PageOptimizer.prototype = {
            

            getPageBundleSetConfig: function(pageName) {
                
                var pageConfig = this.config.getPageConfig(pageName),
                    bundleSetConfig = null;
                
                if (pageConfig) {
                    bundleSetConfig = pageConfig.bundleSetConfig;
                }
                
                if (!bundleSetConfig) {
                    bundleSetConfig = this.config.getBundleSetConfig("default");
                    
                    if (!bundleSetConfig) {
                        bundleSetConfig = this.config.addBundleSetConfig({
                            name: "default"
                        });
                    }
                }
                
                return bundleSetConfig;
            },
            
            /**
             * This enables localization which triggers special bundle and module creation for enabled locales
             *
             * @param context the optimization context (whose i18n property will be initialized to a new I18nContext)
             * @param bundleSetConfig the bundle set configuration that is in use which will have new i18n
             *  bundle configurations added to it
             */
            enableLocalization: function(context, bundleSetConfig) {
                // create the i18n context and configure the bundles for each locale
                context.i18n = require('raptor/optimizer/i18n').createContext({
                    locales: this.config.getLocales()
                });
                context.i18n.addBundleConfigs(bundleSetConfig);
            },

            buildPageBundles: function(options, context) {

                var PageBundles = require('raptor/optimizer/PageBundles'),
                    pageName = options.name || options.pageName,
                    config = this.config,
                    enabledExtensions = packaging.createExtensionCollection(options.enabledExtensions),
                    _this = this;
                
                if (!pageName) {
                    throw raptor.createError(new Error('"name" property is required'));
                }
                
                /*
                 * If there are any globally enabled extensions then add those
                 */
                enabledExtensions.addAll(this.config.getEnabledExtensions());
                context.enabledExtensions = enabledExtensions;
                
                var bundleSetConfig = this.getPageBundleSetConfig(pageName);

                if (this.config.enabledLocales) {
                    this.enableLocalization(context, bundleSetConfig);
                }
                
                var packageManifest = options.packageManifest;
                
                if (!packageManifest) {
                    var packageResource = options.packageResource;
                    if (packageResource) {
                        packageManifest = packaging.getPackageManifest(packageResource);
                    }
                    else {
                        var packageFile = options.packageFile;
                        if (packageFile) {
                            if (typeof packageFile === 'string') {
                                var packageFilePath = packageFile;
                                packageFile = new File(packageFilePath);
                                if (!packageFile.exists()) {
                                    throw raptor.createError(new Error("Provided package file does not exist: " + packageFilePath));
                                }
                            }
                            
                            packageResource = require('raptor/resources').createFileResource(packageFile);
                            packageManifest = packaging.getPackageManifest(packageResource);
                        }
                        else {
                            var dependencies = options.dependencies;
                            if (dependencies) {
                                packageManifest = packaging.createPackageManifest();
                                packageManifest.setDependencies(dependencies);
                            }
                            else {
                                module = options.module;
                                if (module) {
                                    packageManifest = require('raptor/packaging').getModuleManifest(module);
                                }
                            }
                        }
                    }
                }
                else if (!packaging.isPackageManifest(packageManifest)) {
                    throw raptor.createError(new Error("Invalid package manifest: " + packageManifest));
                }
                
                if (!packageManifest) {
                    throw raptor.createError(new Error("Package manifest for page not provided. One of the following properties is required:  packageManifest, packageResource, packageFile, dependencies, module"));
                }

                var sourceUrlResolver = config.hasServerSourceMappings() ? function(path) {
                    return config.getUrlForSourceFile(path);
                } : null;
                
                var startTime = Date.now();
                var bundleMappingsPromise = config.isBundlingEnabled() ?
                        this.getBundleMappingsCached(bundleSetConfig, context) : //Only load the bundle mappings if bundling is enabled
                        null;

                function buildPageBundles(bundleMappings) {

                    var startTime = Date.now();
                    var pageBundles = new PageBundles({
                        pageName: pageName,
                        bundleMappings: bundleMappings,
                        bundlingEnabled: config.isBundlingEnabled(),
                        inPlaceDeploymentEnabled: config.isInPlaceDeploymentEnabled(),
                        sourceUrlResolver: sourceUrlResolver,
                        enabledExtensions: enabledExtensions,
                        packageManifest: packageManifest,
                        checksumsEnabled: config.isChecksumsEnabled(),
                        context: options.context
                    });

                    var pageBundlesPromise = pageBundles.build();
                    pageBundlesPromise.then(function() {
                        logger.info('Page bundles for "' + pageName + '" built in ' + (Date.now() - startTime) + 'ms');
                    });
                    return pageBundlesPromise;
                }


                if (bundleMappingsPromise) {
                    bundleMappingsPromise.then(
                        function() {
                            logger.info('Bundle mappings for page "' + pageName + '" built in ' + (Date.now() - startTime) + 'ms');
                        })
                    return bundleMappingsPromise.then(buildPageBundles);
                }
                else {
                    return buildPageBundles(null);
                }
            },
            
            getBundleMappingsCached: function(bundleSetConfig, context) {
                var cache = this.getCache(context);
                var cacheKey = bundleSetConfig._id;

                var bundleMappingsPromise = cache.getBundleMappings(cacheKey);
                if (!bundleMappingsPromise) {
                    
                    bundleMappingsPromise = this.config.createBundleMappings(bundleSetConfig, context);
                    
                    cache.addBundleMappings(bundleSetConfig._id, bundleMappingsPromise);
                }
                return bundleMappingsPromise;
            },

            buildCacheKey: function(context) {
                var enabledExtensions = context.enabledExtensions;
                return enabledExtensions ? enabledExtensions.getKey() : '';
            },

            getCache: function(context) {
                var key = this.buildCacheKey(context);
                return this.cacheLookup[key] || (this.cacheLookup[key] = new Cache(this.cacheProvider, context, key));
            },

            clearCache: function() {
                raptor.forEachEntry(this.cacheLookup, function(key, cache) {
                    cache.clear();
                });
            },
            
            getConfig: function() {
                return this.config;
            },

            getWriter: function() {
                return this.writer;
            },

            createWriter: function(context) {
                var Writer = this.config.getWriter();

                if (Writer) {
                    if (typeof Writer === 'string') {
                        Writer = require(writer);
                    }
                    else if (typeof Writer !== 'function') {
                        return Writer;
                    }
                }
                else {
                    Writer = OptimizerFileWriter;
                }

                return new Writer(this);
            },

            applyFilters: function(code, contentType, context) {

                var deferred = promises.defer();

                var filters = this.getConfig().getFilters();


                if (!filters || filters.length === 0) {
                    deferred.resolve(code);
                    return deferred.promise;
                }

                var promiseChain = null;

                function onError(e) {
                    deferred.reject(e);
                }

                forEach(filters, function(filterFunc) {
                    if (filterFunc.contentType && filterFunc.contentType !== contentType) {
                        return;
                    }
                    
                    function applyFilter(code) {
                        try
                        {
                            var startTime = Date.now();

                            var output = filterFunc(code, contentType, context);
                            if (output == null) {
                                output = code;
                            }

                            var finishTime = function(code) {
                                var elapsedTime = Date.now() - startTime;
                                if (elapsedTime > 1000) {
                                    logger.debug('Filter (' + filterFunc._name + ') completed in ' + (elapsedTime) + 'ms. Code:\n' + code);
                                }

                                
                            }

                            if (promises.isPromise(output)) {
                                output.then(finishTime);
                            }
                            else {
                                finishTime();
                                var deferred = promises.defer();
                                deferred.resolve(output);
                                output = deferred.promise;
                            }

                            return output;
                        }
                        catch(e) {
                            onError(e);
                        }
                    }

                    if (promiseChain) {
                        promiseChain = promiseChain.then(
                            applyFilter,
                            onError);

                    }
                    else {
                        promiseChain = applyFilter(code);
                    }
                }, this);

                if (!promiseChain) {
                    deferred.resolve(code);
                    return deferred.promise;
                }
                else {
                    promiseChain.then(
                        function(code) {
                            deferred.resolve(code);
                        },
                        onError);

                    promiseChain.done();
                }

                

                return deferred.promise;
            },
            
            getJavaScriptDependencyHtml: function(url) {
                return '<script type="text/javascript" src="' + escapeXmlAttr(url) + '"></script>';
            },

            getCSSDependencyHtml: function(url) {
                return '<link rel="stylesheet" type="text/css" href="' + escapeXmlAttr(url) + '">';
            },

            calculateChecksum: function(code, restrictLength) {
                var shasum = crypto.createHash('sha1');
                shasum.update(code);
                var checksum = shasum.digest('hex'),
                    checksumLength = this.config.getChecksumLength();
                
                if (restrictLength !== false && checksumLength > 0 && checksum.length > checksumLength) {
                    checksum = checksum.substring(0, checksumLength);
                }
                
                return checksum;
            },

            readDependency: function(dependency, context) {

                var deferred = promises.defer();

                function onError(e) {
                    deferred.reject(e);
                }

                var contentType = dependency.getContentType();

                var filterContext = context ? raptor.extend({}, context) : {};
                filterContext.contentType = contentType;
                filterContext.dependency = dependency;
                var _this = this;


                function applyFilters(code) {
                    var promise = _this.applyFilters(code, contentType, filterContext);
                    promise.then(
                        function(code) {
                            deferred.resolve(code);
                        },
                        onError);
                }


                var code = dependency.getCode(context);
                if (promises.isPromise(code)) {
                    var codePromise = code;
                    codePromise.then(applyFilters, onError);
                }
                else {
                    applyFilters(code);
                }

                return deferred.promise;
            },

            readBundle: function(bundle, context, options) {
                var startTime = Date.now();
                options = options || {};
                var includeDependencies = options.includeDependencies === true;

                logger.debug("Reading bundle: " + bundle.getKey());
                var dependencies = bundle.getDependencies();

                var filteredCodeArray = new Array(dependencies.length);
                var deferred = promises.defer();
                var contentType = bundle.getContentType();
                var _this = this;

                var stack = new Error().stack;
                var outputPromise = deferred.promise;

                var checksumsEnabled = options.includeChecksums === true || bundle.checksumsEnabled;
                if (checksumsEnabled === undefined) {
                    // checksumsEnabled not set for bundle so check optimizer config
                    checksumsEnabled = (this.config.checksumsEnabled !== false) || bundle.requireChecksum;
                }

                checksumsEnabled = checksumsEnabled === true;

                function onError(e) {
                    deferred.reject(e);
                }
                
                function finish() {
                    var bundleCode = filteredCodeArray.join("\n");
                    var bundleChecksum = checksumsEnabled ? _this.calculateChecksum(bundleCode) : null;

                    logger.info('Bundle ' + bundle.getKey() + ' read in ' + (Date.now() - startTime) + 'ms');

                    var dependencyInfoArray;

                    if (includeDependencies) {
                        dependencyInfoArray = new Array(dependencies.length);

                        filteredCodeArray.forEach(function(filteredCode, i) {
                            var dependencyChecksum = checksumsEnabled ? _this.calculateChecksum(filteredCode) : null;
                            dependencyInfoArray[i] = {
                                code: filteredCode,
                                checksum: dependencyChecksum,
                                dependency: dependencies[i]
                            };
                        });
                    }
                        

                    deferred.resolve({
                        code: bundleCode,
                        checksum: bundleChecksum,
                        dependencies: dependencyInfoArray
                    });
                }

                var pending = dependencies.length;
                var _this = this;

                dependencies.forEach(function(dependency, i) {
                    // Each filter needs its own context since we update the context with the
                    // current dependency and each dependency is filtered in parallel
                    var filterContext = context ? raptor.extend({}, context) : {};
                    filterContext.bundle = bundle;
                    filterContext.contentType = contentType;
                    filterContext.dependency = dependency;
                    var code = dependency.getCode(context);

                    function applyFilters(code) {
                        var promise = _this.applyFilters(code, contentType, filterContext);
                        promise.then(
                            function(code) {

                                filteredCodeArray[i] = code;

                                if (--pending === 0) {
                                    finish();
                                }
                            },
                            onError);
                    }

                    if (promises.isPromise(code)) {
                        var codePromise = code;
                        codePromise.then(applyFilters, onError);
                    }
                    else {
                        applyFilters(code);
                    }

                    
                }, this);

                return deferred.promise;
            },
            
            optimizePage: function(options) {
                var startTime = new Date().getTime();
                var deferred = promises.defer(); // This will be used to generate the returned promise
                var context = options.context || {};
                var config = this.getConfig();

                if (options.basePath) {
                    context.basePath = options.basePath;
                }

                var pluginContext = {
                    context: context,
                    config: config,
                    options: options,
                    pageOptimizer: this
                };

                config.notifyPlugins('beforeOptimizePage', pluginContext);


                var writer = options.writer || this.createWriter();
                writer.config = config;
                OptimizerWriterMixins.addMixins(writer);
                writer.setPageOptimizer(this);
                writer.setConfig(config);
                writer.setContext(context);

                var optimizedPage = new OptimizedPage();
                
                var slotTracker = new SlotTracker();
                var _this = this;

                context.config = config;
                context.writer = writer;

                function onError(e) {
                    deferred.reject(e);
                }

                function buildLoaderMetadata(pageBundles) {
                    var loaderMetadata = {};

                    if (pageBundles.hasAsyncRequires()) {
                        pageBundles.forEachAsyncRequire(function(asyncRequire) {
                            var entry = loaderMetadata[asyncRequire.getName()] = {
                                requires: [],
                                css: [],
                                js: []
                            };
                            
                            forEach(asyncRequire.getRequires(), function(require) {
                                entry.requires.push(require);
                            });
                            
                            forEach(asyncRequire.getBundles(), function(bundle) {
                                if (bundle.isJavaScript()) {
                                    entry.js.push(bundle.getUrl(context));
                                }
                                else if (bundle.isStyleSheet()) {
                                    entry.css.push(bundle.getUrl(context));
                                }
                                else {
                                    throw raptor.createError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                                }
                            });
                            
                            if (!entry.requires.length) {
                                delete entry.requires;
                            }
                            
                            if (!entry.js.length) {
                                delete entry.js;
                            }
                            
                            if (!entry.css.length) {
                                delete entry.css;
                            }
                        });
                    }

                    context.loaderMetadata = loaderMetadata;
                    optimizedPage.setLoaderMetadata(loaderMetadata);
                }

                function registerBundle(bundle, async) {
                    if (!async) {
                        optimizedPage.addUrl(bundle.getUrl(context), bundle.getSlot(), bundle.getContentType());
                        
                        if (bundle.outputFile) {
                            optimizedPage.addFile(bundle.outputFile, bundle.getContentType());
                        }
                        else if (bundle.sourceResource) {
                            if (bundle.sourceResource.isFileResource()) {
                                optimizedPage.addFile(bundle.sourceResource.getFilePath(), bundle.getContentType());
                            }
                        }
                    }
                    else {
                        // TODO: Should we track URLs and files for async-only bundles?
                    }

                }

                function onBundleWritten(bundle) {
                    registerBundle(bundle, false);
                }

                function onAsyncBundleWritten(bundle) {
                    registerBundle(bundle, true);
                }

                function buildHtmlSlots(pageBundles) {
                    pageBundles.forEachBundle(function(bundle) {
                        var html,
                            url;
                        
                        if (bundle.isInline() && !bundle.inPlaceDeployment) {
                            slotTracker.addContent(bundle.getSlot(), bundle.getContentType(), bundle.getCode(), true /* inline */);
                        }
                        else {
                            url = bundle.getUrl(context);

                            if (bundle.isJavaScript()) {
                                html = _this.getJavaScriptDependencyHtml(url);
                            }
                            else if (bundle.isStyleSheet()) {
                                html = _this.getCSSDependencyHtml(url);
                            }
                            else {
                                throw raptor.createError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                            }
                            slotTracker.addContent(bundle.getSlot(), bundle.getContentType(), html, (!bundle.inPlaceDeployment && bundle.isInline()));
                        }
                    });

                    optimizedPage.setHtmlBySlot(slotTracker.getHtmlBySlot());
                }

                
                var pageBundlesPromise = this.buildPageBundles(options, context);

                pageBundlesPromise
                    .then(
                        function(pageBundles) {

                            // First write out all of the async bundles
                            writer.writeBundles(pageBundles.forEachAsyncBundleIter(), onAsyncBundleWritten)
                                .then(
                                    function() {
                                        // Now that we have build the async bundles we can build the
                                        // loader metadata so that it can be added to page bundles
                                        buildLoaderMetadata(pageBundles);

                                        // Now write out all of the non-async bundles
                                        return writer.writeBundles(pageBundles.forEachBundleIter(), onBundleWritten);
                                    })
                                .then(
                                    function() {

                                        // All of the bundles have now been persisted, now we can
                                        // generate all of the HTML for the page
                                        buildHtmlSlots(pageBundles);


                                        var pageName = options.name || options.pageName;
                                        logger.info('Optimized page "' + pageName + '" in ' + (Date.now() - startTime) + 'ms');

                                        //All done! Resolve the promise with the optimized page
                                        deferred.resolve(optimizedPage);
                                    })
                                .fail(onError);
                        })
                    .fail(onError);
                
                return deferred.promise;
            }
        };
        
        return PageOptimizer;
    });
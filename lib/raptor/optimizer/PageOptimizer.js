var nodePath = require('path');
var q = require('q');
function getResourceUrlCacheKey(path, baseResource) {
    'use strict';
    var key = path;
    if (baseResource) {
        key += '|' + baseResource.getURL();
    }
    return key;
}
define.Class('raptor/optimizer/PageOptimizer', ['raptor'], function (raptor, require, exports, module) {
    'use strict';
    var packaging = require('raptor/packaging');
    var Cache = require('raptor/optimizer/Cache');
    var OptimizerWriterMixins = require('raptor/optimizer/OptimizerWriterMixins');
    var OptimizerFileWriter = require('raptor/optimizer/OptimizerFileWriter');
    var OptimizedPage = require('raptor/optimizer/OptimizedPage');
    var SlotTracker = require('raptor/optimizer/SlotTracker');
    var File = require('raptor/files/File');
    var promises = require('raptor/promises');
    var escapeXmlAttr = require('raptor/xml/utils').escapeXmlAttr;
    var logger = module.logger();
    var crypto = require('crypto');
    var forEach = raptor.forEach;
    var resources = require('raptor/resources');
    var mime = require('raptor/mime');
    /*
     * Bundle wrappers are objects that describe code prefixes and suffixes that
     * will be written for a bundle when enabled. In in-place-deployment mode,
     * a bundle for a source file might not be written so these wrappers will have
     * no impact on those files.
     */
    var DEFAULT_BUNDLE_WRAPPERS = [{
                id: 'raptor-no-conflict',
                prefix: '(function(define, require, raptorNoConflict) {\n',
                suffix: '\n})(window.raptorDefine, window.raptorRequire, true);',
                contentType: 'application/javascript'
            }];
    // This function is moved outside the optimagePageCached method to avoid memory
    // leak from closures
    function evictOptimizedPageFromCache(cache, cacheKey, ttl) {
        logger.info('Scheduling cached object with key "' + cacheKey + '" to be evicted' + ttl + 'ms');
        setTimeout(function () {
            logger.info('Evicting cached object with key "' + cacheKey + '". TTL configured to be ' + ttl + 'ms');
            cache.removeOptimizedPage(cacheKey);
        }, ttl);
    }
    var PageOptimizer = function (config) {
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
        // Look for bundle wrappers from the config object or use the defaults.
        // NOTE: Bundle wrappers have to be explicitly enabled (they're disabled by default).
        //       Bundle wrappers can be enabled in the PageOptimizer Config or BundleConfig.
        var bundleWrappers;
        if (config.wrappers === undefined) {
            bundleWrappers = DEFAULT_BUNDLE_WRAPPERS;
        }
        if (bundleWrappers) {
            // create copy of input bundle wrappers array
            this.bundleWrappers = bundleWrappers.slice();
        }
    };
    PageOptimizer.prototype = {
        getPageBundleSetConfig: function (pageName) {
            var pageConfig = this.config.getPageConfig(pageName), bundleSetConfig = null;
            if (pageConfig) {
                bundleSetConfig = pageConfig.bundleSetConfig;
            }
            if (!bundleSetConfig) {
                bundleSetConfig = this.config.getBundleSetConfig('default');
                if (!bundleSetConfig) {
                    bundleSetConfig = this.config.addBundleSetConfig({ name: 'default' });
                }
            }
            return bundleSetConfig;
        },
        enableLocalization: function (context, bundleSetConfig) {
            // create the i18n context and configure the bundles for each locale
            context.i18n = require('raptor/optimizer/i18n').createContext({ locales: this.config.getLocales() });
        },
        buildPageBundles: function (options, context) {
            var PageBundles = require('raptor/optimizer/PageBundles'), pageName = options.name || options.pageName, config = this.config, enabledExtensions = packaging.createExtensionCollection(options.enabledExtensions);
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
                } else {
                    var packageFile = options.packageFile;
                    if (packageFile) {
                        if (typeof packageFile === 'string') {
                            var packageFilePath = packageFile;
                            packageFile = new File(packageFilePath);
                            if (!packageFile.exists()) {
                                throw raptor.createError(new Error('Provided package file does not exist: ' + packageFilePath));
                            }
                        }
                        packageResource = require('raptor/resources').createFileResource(packageFile);
                        packageManifest = packaging.getPackageManifest(packageResource);
                    } else {
                        var dependencies = options.dependencies;
                        if (dependencies) {
                            packageManifest = packaging.createPackageManifest();
                            packageManifest.setDependencies(dependencies);
                        } else {
                            module = options.module;
                            if (module) {
                                packageManifest = require('raptor/packaging').getModuleManifest(module);
                            }
                        }
                    }
                }
            } else if (!packaging.isPackageManifest(packageManifest)) {
                throw raptor.createError(new Error('Invalid package manifest: ' + packageManifest));
            }
            if (!packageManifest) {
                throw raptor.createError(new Error('Package manifest for page not provided. One of the following properties is required:  packageManifest, packageResource, packageFile, dependencies, module'));
            }
            var sourceUrlResolver = config.hasServerSourceMappings() ? function (path) {
                    return config.getUrlForSourceFile(path);
                } : null;
            var startTime = Date.now();
            var bundleMappingsPromise = config.isBundlingEnabled() ? this.getBundleMappingsCached(bundleSetConfig, context) : null;
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
                pageBundlesPromise.then(function () {
                    logger.info('Page bundles for "' + pageName + '" built in ' + (Date.now() - startTime) + 'ms');
                });
                return pageBundlesPromise;
            }
            if (bundleMappingsPromise) {
                bundleMappingsPromise.then(function () {
                    logger.info('Bundle mappings for page "' + pageName + '" built in ' + (Date.now() - startTime) + 'ms');
                });
                return bundleMappingsPromise.then(buildPageBundles);
            } else {
                return buildPageBundles(null);
            }
        },
        getBundleMappingsCached: function (bundleSetConfig, context) {
            var cache = this.getCache(context);
            var cacheKey = bundleSetConfig._id;
            var bundleMappingsPromise = cache.getBundleMappings(cacheKey);
            if (!bundleMappingsPromise) {
                bundleMappingsPromise = this.config.createBundleMappings(bundleSetConfig, context);
                cache.addBundleMappings(bundleSetConfig._id, bundleMappingsPromise);
            }
            return bundleMappingsPromise;
        },
        uncacheBundleMappings: function (bundleSetConfig, context) {
            var cache = this.getCache(context);
            cache.removeBundleMappings(bundleSetConfig._id);
        },
        buildCacheKey: function (context) {
            var config = this.getConfig();
            var cacheKey = null;
            function cacheKey_add(str) {
                if (cacheKey) {
                    cacheKey += '|' + str;
                } else {
                    cacheKey = str;
                }
            }
            config.notifyPlugins('buildCacheKey', {
                context: context,
                config: config,
                pageOptimizer: this,
                cacheKey: { add: cacheKey_add }
            });
            var enabledExtensions = context.enabledExtensions;
            if (enabledExtensions) {
                cacheKey_add(enabledExtensions.getKey());
            }
            return cacheKey || '';
        },
        getCache: function (context) {
            var key = this.buildCacheKey(context);
            return this.cacheLookup[key] || (this.cacheLookup[key] = new Cache(this.cacheProvider, context, key));
        },
        clearCache: function () {
            raptor.forEachEntry(this.cacheLookup, function (key, cache) {
                cache.clear();
            });
        },
        clearBundleMappingsCache: function () {
            raptor.forEachEntry(this.cacheLookup, function (key, cache) {
                logger.info('Removing bundle mappings for cache ' + key);
                cache.removeAllBundleMappings();
            });
        },
        getConfig: function () {
            return this.config;
        },
        getWriter: function () {
            return this.writer || this.createWriter();
        },
        createWriter: function (context) {
            var Writer = this.config.getWriter();
            if (Writer) {
                if (typeof Writer === 'string') {
                    Writer = require(Writer);
                } else if (typeof Writer !== 'function') {
                    return Writer;
                }
            } else {
                Writer = OptimizerFileWriter;
            }
            var writer = new Writer(this);
            this.writer = writer;
            return writer;
        },
        applyFilters: function (code, contentType, context) {
            var deferred = promises.defer();
            var filters = this.getConfig().getFilters();
            if (!filters || filters.length === 0) {
                deferred.resolve(code);
                return deferred.promise;
            }
            var promiseChain = null;
            var errorHandled = false;
            function onError(e) {
                if (errorHandled) {
                    return;
                }
                errorHandled = true;
                deferred.reject(e);
            }
            forEach(filters, function (filterFunc) {
                if (filterFunc.contentType && filterFunc.contentType !== contentType) {
                    return;
                }
                function applyFilter(code) {
                    try {
                        var startTime = Date.now();
                        var output = filterFunc(code, contentType, context);
                        if (output == null) {
                            output = code;
                        }
                        var finishTime = function (code) {
                            var elapsedTime = Date.now() - startTime;
                            if (elapsedTime > 1000) {
                                logger.debug('Filter (' + filterFunc._name + ') completed in ' + elapsedTime + 'ms. Code:\n' + code);
                            }
                        };
                        if (promises.isPromise(output)) {
                            output.then(finishTime);
                        } else {
                            finishTime();
                            var deferred = promises.defer();
                            deferred.resolve(output);
                            output = deferred.promise;
                        }
                        return output;
                    } catch (e) {
                        onError(e);
                    }
                }
                if (promiseChain) {
                    promiseChain = promiseChain.then(applyFilter, onError);
                } else {
                    promiseChain = applyFilter(code);
                }
            }, this);
            if (!promiseChain) {
                deferred.resolve(code);
                return deferred.promise;
            } else {
                promiseChain.then(function (code) {
                    deferred.resolve(code);
                }, onError);
                promiseChain.fail(onError);
            }
            return deferred.promise;
        },
        getJavaScriptDependencyHtml: function (url) {
            return '<script type="text/javascript" src="' + escapeXmlAttr(url) + '"></script>';
        },
        getCSSDependencyHtml: function (url) {
            return '<link rel="stylesheet" type="text/css" href="' + escapeXmlAttr(url) + '">';
        },
        calculateChecksum: function (code, restrictLength) {
            var shasum = crypto.createHash('sha1');
            shasum.update(code);
            var checksum = shasum.digest('hex'), checksumLength = this.config.getChecksumLength();
            if (restrictLength !== false && checksumLength > 0 && checksum.length > checksumLength) {
                checksum = checksum.substring(0, checksumLength);
            }
            return checksum;
        },
        readDependency: function (dependency, context) {
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
                promise.then(function (code) {
                    deferred.resolve(code);
                }, onError);
            }
            try {
                var code = dependency.getCode(context);
                if (promises.isPromise(code)) {
                    var codePromise = code;
                    codePromise.then(applyFilters, onError);
                } else {
                    applyFilters(code);
                }
            } catch (e) {
                logger.error('Error getting code for dependency ' + dependency, e);
                onError(e);
            }
            return deferred.promise;
        },
        readBundle: function (bundle, context, options) {
            var startTime = Date.now();
            options = options || {};
            var includeDependencies = options.includeDependencies === true;
            logger.debug('Reading bundle: ' + bundle.getKey());
            var dependencies = bundle.getDependencies();
            var deferred = promises.defer();
            var contentType = bundle.getContentType();
            var _this = this;
            var checksumsEnabled = options.includeChecksums === true || bundle.checksumsEnabled;
            if (checksumsEnabled === undefined) {
                // checksumsEnabled not set for bundle so check optimizer config
                checksumsEnabled = this.config.checksumsEnabled !== false || bundle.requireChecksum;
            }
            checksumsEnabled = checksumsEnabled === true;
            var errorHandled = false;
            function onError(e) {
                if (errorHandled) {
                    return;
                }
                errorHandled = true;
                logger.error('Unable to read bundle ' + bundle.getKey() + '. Exception: ' + (e.stack || e));
                deferred.reject(e);
            }
            // Step 1
            function filterCode() {
                var filteredCodeArray = new Array(dependencies.length);
                var pending = dependencies.length;
                var filterCodeDeferred = promises.defer();
                var errorHandled = false;
                function filterCodeOnError(e) {
                    if (errorHandled) {
                        return;
                    }
                    errorHandled = true;
                    filterCodeDeferred.reject(e);
                }
                dependencies.forEach(function (dependency, i) {
                    // Each filter needs its own context since we update the context with the
                    // current dependency and each dependency is filtered in parallel
                    var filterContext = context ? raptor.extend({}, context) : {};
                    filterContext.bundle = bundle;
                    filterContext.contentType = contentType;
                    filterContext.dependency = dependency;
                    var code = dependency.getCode(context);
                    function applyFilters(code) {
                        var promise = _this.applyFilters(code, contentType, filterContext);
                        promise.then(function (code) {
                            filteredCodeArray[i] = code;
                            if (--pending === 0) {
                                filterCodeDeferred.resolve(filteredCodeArray);
                            }
                        }).fail(filterCodeOnError);
                    }
                    if (promises.isPromise(code)) {
                        var codePromise = code;
                        codePromise.then(applyFilters).fail(filterCodeOnError);
                    } else {
                        applyFilters(code);
                    }
                });
                return filterCodeDeferred.promise;
            }
            // Step 2
            function finish(filteredCodeArray) {
                var bundleCode = filteredCodeArray.join('\n');
                var bundleChecksum = checksumsEnabled ? _this.calculateChecksum(bundleCode) : null;
                logger.info('Bundle ' + bundle.getKey() + ' read in ' + (Date.now() - startTime) + 'ms');
                var dependencyInfoArray;
                if (includeDependencies) {
                    dependencyInfoArray = new Array(dependencies.length);
                    filteredCodeArray.forEach(function (filteredCode, i) {
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
            try {
                filterCode().then(finish).fail(onError);
            } catch (e) {
                onError(e);
            }
            return deferred.promise;
        },
        optimizePageCached: function (context, cacheKey, options) {
            if (!context) {
                context = {};
            }
            var cache = this.getCache(context);
            var optimizedPage = cache.getOptimizedPage(cacheKey);
            var _this = this;
            var rebuildCacheTimeout = -1;
            var cacheTTL = -1;
            function handleRebuildCacheTimeout() {
                if (rebuildCacheTimeout !== -1) {
                    logger.debug('Scheduling optimized page to be rebuilt in ' + rebuildCacheTimeout + 'ms');
                    setTimeout(function () {
                        logger.debug('Rebuilding optimizer cache...');
                        try {
                            _this.optimizePage(options).then(cacheOptimizedPage, handleRebuildCacheTimeout);
                        } catch (e) {
                            logger.error('Error in handleRebuildCacheTimeout: ', e);
                        }
                    }, rebuildCacheTimeout);
                    rebuildCacheTimeout = -1;
                }
            }
            function handleCacheTimeToLive() {
                if (cacheTTL !== -1) {
                    evictOptimizedPageFromCache(cache, cacheKey, cacheTTL);
                    cacheTTL = -1;
                }
            }
            function cacheOptimizedPage(optimizedPage) {
                handleRebuildCacheTimeout();
                handleCacheTimeToLive();
            }
            if (!optimizedPage) {
                if (typeof options === 'function') {
                    options = options();
                }
                context.setRebuildCacheTimeout = function (newCacheTimeout) {
                    rebuildCacheTimeout = newCacheTimeout;
                };
                context.setCacheTimeToLive = function (newTTL) {
                    cacheTTL = newTTL;
                };
                context.isOptimizedPageCached = function () {
                    var cachedOptimizedPage = cache.getOptimizedPage(cacheKey);
                    return cachedOptimizedPage && !promises.isPromise(cachedOptimizedPage);
                };
                var optimizedPagePromise = this.optimizePage(options);
                optimizedPage = optimizedPagePromise;
                cache.addOptimizedPage(cacheKey, optimizedPagePromise);
                optimizedPagePromise.then(cacheOptimizedPage).fail(function () {
                    // Remove the failed promise so that we can try again next time
                    cache.removeOptimizedPage(cacheKey);
                });
            }
            return optimizedPage;
        },
        optimizePage: function (options) {
            var startTime = new Date().getTime();
            var deferred = promises.defer();
            // This will be used to generate the returned promise
            // if we create a new context then make sure we put it
            // back into the options object for reference later
            var context = options.context || (options.context = {});
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
            var writer = options.writer || this.getWriter();
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
            context.optimizer = this;
            if (!context.attributes) {
                context.attributes = {};
            }
            var errorHandled = false;
            function onError(e) {
                if (errorHandled) {
                    return;
                }
                errorHandled = true;
                deferred.reject(e);
            }
            if (config.bundleWrappers) {
                logger.info('Enabled bundle wrappers: ' + Object.keys(config.bundleWrappers).join(', ') + ' (these can be overridden at the bundle level)');
            } else {
                logger.info('No bundle wrappers enabled (this can be overridden at the bundle level)');
            }
            function buildLoaderMetadata(pageBundles) {
                var loaderMetadata = {};
                if (pageBundles.hasAsyncRequires()) {
                    pageBundles.forEachAsyncRequire(function (asyncRequire) {
                        var entry = loaderMetadata[asyncRequire.getName()] = {
                                requires: [],
                                css: [],
                                js: []
                            };
                        forEach(asyncRequire.getRequires(), function (require) {
                            entry.requires.push(require);
                        });
                        forEach(asyncRequire.getBundles(), function (bundle) {
                            if (bundle.isJavaScript()) {
                                entry.js.push(bundle.getUrl(context));
                            } else if (bundle.isStyleSheet()) {
                                entry.css.push(bundle.getUrl(context));
                            } else {
                                throw raptor.createError(new Error('Invalid bundle content type: ' + bundle.getContentType()));
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
                    } else if (bundle.sourceResource) {
                        if (bundle.sourceResource.isFileResource()) {
                            optimizedPage.addFile(bundle.sourceResource.getFilePath(), bundle.getContentType());
                        }
                    }
                } else {
                }
            }
            function onBundleWritten(bundle) {
                registerBundle(bundle, false);
            }
            function onAsyncBundleWritten(bundle) {
                registerBundle(bundle, true);
            }
            function buildHtmlSlots(pageBundles) {
                pageBundles.forEachBundle(function (bundle) {
                    var html, url;
                    if (bundle.isInline() && !bundle.inPlaceDeployment) {
                        if (bundle.isMergeInline()) {
                            slotTracker.addContent(bundle.getSlot(), bundle.getContentType(), bundle.getCode(), true);
                        } else {
                            slotTracker.addContentBlock(bundle.getSlot(), bundle.getContentType(), bundle.getCode());
                        }
                    } else {
                        url = bundle.getUrl(context);
                        if (bundle.isJavaScript()) {
                            html = _this.getJavaScriptDependencyHtml(url);
                        } else if (bundle.isStyleSheet()) {
                            html = _this.getCSSDependencyHtml(url);
                        } else {
                            throw raptor.createError(new Error('Invalid bundle content type: ' + bundle.getContentType()));
                        }
                        slotTracker.addContent(bundle.getSlot(), bundle.getContentType(), html, !bundle.inPlaceDeployment && bundle.isInline());
                    }
                });
                optimizedPage.setHtmlBySlot(slotTracker.getHtmlBySlot());
            }
            var pageBundlesPromise = this.buildPageBundles(options, context);
            pageBundlesPromise.then(function (pageBundles) {
                // First write out all of the async bundles
                writer.writeBundles(pageBundles.forEachAsyncBundleIter(), onAsyncBundleWritten).then(function () {
                    try {
                        // Now that we have build the async bundles we can build the
                        // loader metadata so that it can be added to page bundles
                        buildLoaderMetadata(pageBundles);
                        // Now write out all of the non-async bundles
                        return writer.writeBundles(pageBundles.forEachBundleIter(), onBundleWritten);
                    } catch (e) {
                        onError(e);
                    }
                }).then(function () {
                    // All of the bundles have now been persisted, now we can
                    // generate all of the HTML for the page
                    buildHtmlSlots(pageBundles);
                    var pageName = options.name || options.pageName;
                    logger.info('Optimized page "' + pageName + '" in ' + (Date.now() - startTime) + 'ms');
                    //All done! Resolve the promise with the optimized page
                    deferred.resolve(optimizedPage);
                }).fail(onError);
            }).fail(onError);
            return deferred.promise;
        },
        getBundleWrappers: function () {
            return this.bundleWrappers;
        },
        isWrapperEnabledForBundle: function (wrapper, bundle) {
            var wrapperId = wrapper.id;
            if (wrapper.contentType !== bundle.getContentType()) {
                logger.debug('Bundle wrapper "' + wrapperId + '" with contentType "' + wrapper.contentType + '" does not match bundle content type of "' + bundle.getContentType() + '"');
                return false;
            }
            // are there any wrappers explicitly configured for the bundle?
            var enabledWrappers = bundle.getWrappers();
            if (bundle.wrappers === undefined) {
                // no wrappers set at the bundle level so check for which wrappers have been "globally" enabled
                enabledWrappers = this.config.bundleWrappers;
            }
            return enabledWrappers && enabledWrappers[wrapperId] === true;
        },
        resolveResourceUrlCached: function (path, baseResource, context) {
            var cache = this.getCache(context);
            var cacheKey = getResourceUrlCacheKey(path, baseResource);
            var resourceUrl = cache.getResourceUrl(cacheKey);
            if (resourceUrl) {
                return resourceUrl;
            }
            resourceUrl = this.resolveResourceUrl(path, baseResource, context);
            cache.addResourceUrl(cacheKey, resourceUrl);
            resourceUrl.fail(function () {
                // Remove the cached resource URL if the promise
                // is rejected in order to give the system
                // a chance to recover
                cache.removeResourceUrl(cacheKey);
            });
            return resourceUrl;
        },
        resolveResourceUrl: function (path, baseResource, context) {
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
                return path;
            }
            context = context || {};
            var inPlaceFromDir = context.inPlaceFromDir;
            var relativeFromDir = context.relativeFromDir;
            var writer = this.getWriter();
            var config = this.getConfig();
            var inputPath = path;
            var hashString = '', hashStart = path.indexOf('#');
            if (hashStart != -1) {
                hashString = path.substring(hashStart);
                path = path.substring(0, hashStart);
            }
            var queryString = '', queryStart = path.indexOf('?');
            if (queryStart != -1) {
                queryString = path.substring(queryStart);
                path = path.substring(0, queryStart);
            }
            var resource = resources.resolveResource(baseResource, path);
            if (resource && resource.isFileResource() && resource.exists()) {
                if (inPlaceFromDir && config.isInPlaceDeploymentEnabled()) {
                    // This code block is for in-place deployment, but the CSS resource needs to be
                    // compiled (such as LESS). While we can't do in-place deployment for the
                    // LESS file (since it needs to be compiled), we can at least rewrite the
                    // image URLs to point to the original location. Therefore, we need to modify
                    // the relative path based on the fact that the final CSS file will be
                    // in a new directory.
                    path = writer.urlBuilder.getInPlaceResourceUrl(resource.getFilePath(), inPlaceFromDir);
                    if (path) {
                        path += queryString + hashString;
                        logger.debug('Resolved URL: ' + inputPath + ' --> ' + path);
                        return q(path);
                    }
                }
                var base64Encode = queryString === '?base64';
                if (base64Encode && writer.base64EncodeSupported !== true) {
                    // We only do the Base64 encoding if the writer prefers not
                    // to do the Base64 encoding or does not support Base64 encoding
                    path = 'data:' + mime.lookup(resource.getPath()) + ';base64,' + resource.readAsBinary().toString('base64');
                    return q(path);
                } else {
                    context = raptor.extend({}, context);
                    // Record that base 64 encoding was requested for this resource (this might be helpful to the writer)
                    context.base64EncodeUrl = base64Encode;
                    return writer.writeResource(resource, context).then(function (outputFileInfo) {
                        if (relativeFromDir && outputFileInfo.file) {
                            // The resource was written to disk, we can calculate
                            // a relative path from the optimizer output directory (where this CSS file will reside)
                            // to the output image/resource
                            path = nodePath.relative(relativeFromDir, outputFileInfo.file.getAbsolutePath()) + queryString + hashString;
                        } else if (outputFileInfo.url) {
                            path = outputFileInfo.url;
                            if (path.startsWith('data:') === false) {
                                path = path + queryString + hashString;
                            }
                        } else {
                            throw new Error('Invalid output from "writer.writeResource": ' + require('util').inspect(outputFileInfo));
                        }
                        logger.debug('Resolved URL: ', inputPath, ' --> ', path);
                        return path;
                    });
                }
            }
            path = inputPath;
            logger.debug('Resolved URL: ', inputPath, ' --> ', path);
            return q(path);
        }
    };
    return PageOptimizer;
});
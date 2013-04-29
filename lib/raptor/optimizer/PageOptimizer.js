var util = require('util');

define.Class(
    'raptor/optimizer/PageOptimizer',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var packaging = require('raptor/packaging'),
            Cache = require('raptor/optimizer/Cache'),
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
            this.config = config || {};
            this.cacheLookup = {};
            this.cacheProvider = config.cacheProvider || require('raptor/caching').getDefaultProvider();
            this.filters = [];
            this.loadFiltersFromConfig(config);
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
            
            buildPageBundles: function(options) {

                var startTime = new Date().getTime();

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
                
                var bundleSetConfig = this.getPageBundleSetConfig(pageName);
                
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
                
                var bundleMappingsPromise = config.isBundlingEnabled() ? 
                        this.getBundleMappingsCached(bundleSetConfig, enabledExtensions) : //Only load the bundle mappings if bundling is enabled
                        null;

                function buildPageBundles(bundleMappings) {


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
                    // pageBundlesPromise.then(function() {
                    //     logger.info('Optimized page bundles for "' + pageName + '" built in ' + (new Date().getTime() - startTime) + 'ms');
                    // });
                    return pageBundlesPromise;
                }


                if (bundleMappingsPromise) {
                    return bundleMappingsPromise.then(buildPageBundles);
                }
                else {
                    return buildPageBundles(null);
                }
            },
            
            getBundleMappingsCached: function(bundleSetConfig, enabledExtensions) {
                var cache = this.getCache(enabledExtensions);
                var cacheKey = bundleSetConfig._id;

                var bundleMappingsPromise = cache.getBundleMappings(cacheKey);
                if (!bundleMappingsPromise) {
                    bundleMappingsPromise = this.config.createBundleMappings(bundleSetConfig, enabledExtensions);
                    
                    cache.addBundleMappings(bundleSetConfig._id, bundleMappingsPromise);
                }
                return bundleMappingsPromise;
            },


            getCache: function(enabledExtensions) {
                var key = enabledExtensions ? enabledExtensions.getKey() : '';
                return this.cacheLookup[key] || (this.cacheLookup[key] = new Cache(this.cacheProvider, enabledExtensions));
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
                var writer = this.config.getWriter();
                if (writer) {
                    if (typeof writer === 'string') {
                        var Writer = require(writer);
                        return new Writer(this, context);
                    }
                    else {
                        return writer;
                    }
                }
                
                return new OptimizerFileWriter(this, context);
            },

            addFilter: function(filter) {
                var filterFunc,
                    filterThisObj;

                if (typeof filter === 'function') {
                    filterFunc = filter;
                }
                else if (typeof filter === 'string') {
                    filter = require(filter);
                    if (typeof filter === 'function') {
                        var FilterClass = filter;
                        filter = new FilterClass();
                    }
                    filterFunc = filter.filter;
                    filterThisObj = filter;
                }
                else if (typeof filter === 'object'){
                    filterFunc = filter.filter;
                    filterThisObj = filter;
                }
                else {
                    throw new Error("Invalid filter: " + filter);
                }


                if (filterThisObj) {
                    filterFunc = filterFunc.bind(filterThisObj);
                }

                this.filters.push(filterFunc);
            },

            loadFiltersFromConfig: function(config) {
                if (config.isMinifyJsEnabled()) {
                    this.addFilter(require("raptor/optimizer/MinifyJSFilter"));
                }

                if (config.isMinifyCssEnabled()) {
                    this.addFilter(require("raptor/optimizer/MinifyCSSFilter"));
                }

                if (config.isResolveCssUrlsEnabled()) {
                    this.addFilter(require("raptor/optimizer/ResolveCSSUrlsFilter"));
                }
                
                raptor.forEach(config.getFilters(), function(filterConfig) {
                    var Filter = require(filterConfig.className);
                    if (Filter.filter) {
                        this.addFilter(Filter);
                    }
                    else if (typeof Filter === 'function') {
                        if (Filter.prototype.filter) {
                            this.addFilter(new Filter());
                        }
                        else {
                            this.addFilter(Filter);
                        }
                    }
                    else {
                        throw raptor.createError(new Error('Invalid filter: ' + filterConfig));
                    }
                }, this);
            },

            applyFilters: function(code, contentType, context) {

                var deferred = promises.defer();

                if (!this.filters || this.filters.length === 0) {
                    deferred.resolve(code);
                    return deferred.promise;
                }

                var promiseChain = null;

                function onError(e) {
                    deferred.reject(e);
                }

                forEach(this.filters, function(filterFunc) {
                        
                    function applyFilter(code) {
                        try
                        {
                            var output = filterFunc(code, contentType, context);
                            if (output == null) {
                                output = code;
                            }

                            if (!promises.isPromise(output)) {
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

            calculateChecksum: function(code) {                
                var shasum = crypto.createHash('sha1');
                shasum.update(code);
                var checksum = shasum.digest('hex'),
                    checksumLength = this.config.getChecksumLength();
                
                if (checksumLength > 0 && checksum.length > checksumLength) {
                    checksum = checksum.substring(0, checksumLength);
                }
                
                return checksum;
            },

            readBundle: function(bundle, context) {

                var filteredCode = [];
                var promisesArray = [];
                var deferred = promises.defer();
                var contentType = bundle.getContentType();

                var stack = new Error().stack;
                var outputPromise = deferred.promise;

                function onError(e) {
                    deferred.reject(e);
                }

                bundle.forEachDependency(function(dependency, i) {
                    // Each filter needs its own context since we update the context with the
                    // current dependency and each dependency is filtered in parallel
                    var filterContext = context ? raptor.extend({}, context) : {};
                    filterContext.bundle = bundle;
                    filterContext.contentType = contentType;
                    filterContext.dependency = dependency;
                    var code = dependency.getCode(context);
                    var promise = this.applyFilters(code, contentType, filterContext);
                    promise.then(
                        function(code) {
                            filteredCode[i] = code;
                        },
                        onError);
                    promisesArray.push(promise);
                }, this);
                
                promises.all(promisesArray)
                    .then(
                        function() {
                            var code = filteredCode.join("\n");
                            deferred.resolve(code);
                        },
                        onError);

                return deferred.promise;
            },
            
            optimizePage: function(options) {
                var startTime = new Date().getTime();
                var deferred = promises.defer(); // This will be used to generate the returned promise
                var context = options.context || {};
                
                if (options.basePath) {
                    context.basePath = options.basePath;
                }
                var writer = options.writer || this.createWriter(context);
                writer.setContext(context);

                var pageBundlesPromise = this.buildPageBundles(options);

                var optimizedPage = new OptimizedPage();
                var config = this.getConfig();
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
                        optimizedPage.addUrl(bundle.getUrl(), bundle.getSlot(), bundle.getContentType());    
                        
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

                pageBundlesPromise
                    .then(
                        function(pageBundles) {
                            
                            if (logger.isDebugEnabled()) {
                                // logger.debug('page bundles: ' + util.inspect(pageBundles));
                            }

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
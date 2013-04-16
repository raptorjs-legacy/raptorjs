define.Class(
    'raptor/optimizer/PageOptimizer',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var packaging = require('raptor/packaging'),
            Cache = require('raptor/optimizer/Cache'),
            BundleFileWriter = require('raptor/optimizer/BundleFileWriter'),
            BundleUrlBuilder = require('raptor/optimizer/BundleUrlBuilder'),
            File = require('raptor/files/File'),
            promises = require('raptor/promises'),
            logger = module.logger();
        
        var PageOptimizer = function(config) {
            this.config = config || {};
            this.cacheLookup = {};
            this.cacheProvider = config.cacheProvider || require('raptor/caching').getDefaultProvider();
            this.writer = this.createBundleWriter();
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
                        checksumsEnabled: config.isChecksumsEnabled()
                    });

                    var pageBundlesPromise = pageBundles.build();
                    pageBundlesPromise.then(function() {
                        logger.info('Optimized page bundles for "' + pageName + '" built in ' + (new Date().getTime() - startTime) + 'ms');
                    });
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

            createBundleWriter: function() {
                var config = this.config,     
                    outputDir = config.getOutputDir(), 
                    urlPrefix = config.getUrlPrefix(),
                    urlBuilder = new BundleUrlBuilder(urlPrefix, outputDir, config),
                    writer = new BundleFileWriter(config, urlBuilder);
                
                writer.context.raptorConfig = config.getRaptorConfigJSON();

                if (config.isMinifyJsEnabled()) {
                    writer.addFilter(require("raptor/optimizer/MinifyJSFilter"));
                }

                if (config.isMinifyCssEnabled()) {
                    writer.addFilter(require("raptor/optimizer/MinifyCSSFilter"));
                }

                if (config.isResolveCssUrlsEnabled()) {
                    writer.addFilter(require("raptor/optimizer/ResolveCSSUrlsFilter"));
                }
                
                raptor.forEach(config.getFilters(), function(filterConfig) {
                    var Filter = require(filterConfig.className);
                    if (Filter.filter) {
                        writer.addFilter(Filter);
                    }
                    else if (typeof Filter === 'function') {
                        if (Filter.prototype.filter) {
                            writer.addFilter(new Filter());
                        }
                        else {
                            writer.addFilter(Filter);
                        }
                    }
                    else {
                        throw raptor.createError(new Error('Invalid filter: ' + filterConfig));
                    }
                });
                
                return writer;
            },
            
            optimizePage: function(options) {

                var startTime = new Date().getTime();
                var deferred = promises.defer();
                var writer = this.getWriter();
                var pageBundles = this.buildPageBundles(options);
                
                function onError(e) {
                    deferred.reject(e);
                }

                pageBundles.then(
                    function(pageBundles) {
                        
                        var basePath = options.basePath;
                        var optimizedPage = writer.writePageBundles(pageBundles, basePath);
                        var pageName = options.name || options.pageName;
                        logger.info('Optimized page "' + pageName + '" in ' + (new Date().getTime() - startTime) + 'ms');
                        deferred.resolve(optimizedPage);
                    },
                    onError);
                
                return deferred.promise;
            }
        };
        
        return PageOptimizer;
    });
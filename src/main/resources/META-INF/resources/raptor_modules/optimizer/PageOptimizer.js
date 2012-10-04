raptor.defineClass(
    'optimizer.PageOptimizer',
    function(raptor) {
        "use strict";
        
        var packager = raptor.require('packager'),
            Cache = raptor.require('optimizer.Cache'),
            BundlesFileWriter = raptor.require('optimizer.BundlesFileWriter'),
            BundleUrlBuilder = raptor.require('optimizer.BundleUrlBuilder'),
            File = raptor.require('files').File;
        
        var PageOptimizer = function(config) {
            this.config = config;
            this.writer = this.createBundlesWriter();
            this.cacheLookup = {};
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
                var PageBundles = raptor.require('optimizer.PageBundles'),
                    pageName = options.name,
                    config = this.config,
                    enabledExtensions = packager.createExtensionCollection(options.enabledExtensions);
                
                if (!pageName) {
                    throw raptor.createError(new Error('"pageName" property is required'));
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
                        packageManifest = packager.getPackageManifest(packageResource);
                    }
                    else {
                        var packageFile = options.packageFile;
                        if (packageFile) {
                            if (typeof packageFile === 'string') {
                                packageFile = new File(packageFile);
                            }
                            packageResource = raptor.require('resources').createFileResource(packageFile);
                            packageManifest = packager.getPackageManifest(packageResource);
                        }
                        else {
                            includes = options.includes;
                            if (includes) {
                                packageManifest = packager.createPackageManifest();
                                packageManifest.setIncludes(includes);
                            }
                        }
                    }
                }
                else if (!packager.isPackageManifest(packageManifest)) {
                    throw raptor.createError(new Error("Invalid package manifest: " + packageManifest));
                }
                
                if (!packageManifest) {
                    throw raptor.createError(new Error("Package manifest for page not provided. One of the following properties is required:  packageManifest, packageResource, includes"));
                }

                var sourceUrlResolver = config.hasServerSourceMappings() ? function(path) {
                    return config.getUrlForSourceFile(path);
                } : null;
                
                var bundleMappings = config.isBundlingEnabled() ? 
                        this.getBundleMappingsCached(bundleSetConfig, enabledExtensions) : //Only load the bundle mappings if bundling is enabled
                        null;
                
                var pageBundles = new PageBundles({
                    pageName: pageName,
                    bundleMappings: bundleMappings,
                    bundlingEnabled: this.config.isBundlingEnabled(),
                    inPlaceDeploymentEnabled: config.isInPlaceDeploymentEnabled(),
                    sourceUrlResolver: sourceUrlResolver,
                    enabledExtensions: enabledExtensions,
                    packageManifest: packageManifest
                });
                
                return pageBundles;

            },
            
            getBundleMappingsCached: function(bundleSetConfig, enabledExtensions) {
                var cache = this.getCache(enabledExtensions);
                var bundleMappings = cache.getBundleMappings(bundleSetConfig._id);
                if (!bundleMappings) {
                    bundleMappings = this.config.createBundleMappings(bundleSetConfig, enabledExtensions);
                    cache.addBundleMappings(bundleSetConfig._id, bundleMappings);
                }
                return bundleMappings;
            },


            getCache: function(enabledExtensions) {
                var key = enabledExtensions ? enabledExtensions.getKey() : '';
                return this.cacheLookup[key] || (this.cacheLookup[key] = new Cache());
            },
            
            
            getConfig: function() {
                return this.config;
            },
            
            setConfig: function(config) {
                this.config = config;
            },
            
            createBundlesWriter: function() {
                var config = this.config,     
                    outputDir = config.getOutputDir(), 
                    urlPrefix = config.getUrlPrefix(),
                    urlBuilder = new BundleUrlBuilder(urlPrefix, outputDir),
                    writer = new BundlesFileWriter(config, urlBuilder);
                
                writer.context.raptorConfig = config.getRaptorConfigJSON();
                
                if (config.isMinifyJsEnabled()) {
                    writer.addFilter(raptor.require("optimizer.MinifyJSFilter"));
                }

                if (config.isResolveCssUrlsEnabled()) {
                    writer.addFilter(raptor.require("optimizer.ResolveCSSUrlsFilter"));
                }
                
                raptor.forEach(config.getFilters(), function(filterConfig) {
                    var Filter = raptor.require(filterConfig.className);
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
                var pageBundles = this.buildPageBundles(options);
                var basePath = options.basePath;
                var optimizedPage = this.writer.writePageBundles(pageBundles, basePath);
                return optimizedPage;
            }
        };
        
        return PageOptimizer;
    });
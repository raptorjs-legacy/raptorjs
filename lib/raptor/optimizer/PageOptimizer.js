define.Class(
    'raptor/optimizer/PageOptimizer',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var packaging = require('raptor/packaging'),
            Cache = require('raptor/optimizer/Cache'),
            BundleFileWriter = require('raptor/optimizer/BundleFileWriter'),
            BundleUrlBuilder = require('raptor/optimizer/BundleUrlBuilder'),
            File = require('raptor/files/File');
        
        var PageOptimizer = function(config) {
            this.config = config;
            this.cacheLookup = {};
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
                var PageBundles = require('raptor/optimizer/PageBundles'),
                    pageName = options.name || options.pageName,
                    config = this.config,
                    enabledExtensions = packaging.createExtensionCollection(options.enabledExtensions);
                
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
                                packageFile = new File(packageFile);
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
                        }
                    }
                }
                else if (!packaging.isPackageManifest(packageManifest)) {
                    throw raptor.createError(new Error("Invalid package manifest: " + packageManifest));
                }
                
                if (!packageManifest) {
                    throw raptor.createError(new Error("Package manifest for page not provided. One of the following properties is required:  packageManifest, packageResource, dependencies"));
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
                    packageManifest: packageManifest,
                    checksumsEnabled: this.config.isChecksumsEnabled()
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
                var writer = this.getWriter();
                var pageBundles = this.buildPageBundles(options);
                var basePath = options.basePath;
                var optimizedPage = writer.writePageBundles(pageBundles, basePath);
                return optimizedPage;
            }
        };
        
        return PageOptimizer;
    });
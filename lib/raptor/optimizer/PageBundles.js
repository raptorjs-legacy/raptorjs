define.Class(
    "raptor/optimizer/PageBundles",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry;
        var forEach = raptor.forEach;
        var BundleMappings = require('raptor/optimizer/BundleMappings');
        var promises = require('raptor/promises');
        
        var AsyncRequire = function(name) {
            this.name = name;
            this.requires = [];
            this.requiresByName = {};
            this.bundles = [];
            this.bundlesByKey = {};
        };
        
        AsyncRequire.prototype = {
            getName: function() {
                return this.name;
            },
            
            addRequire: function(name) {
                if (!this.requiresByName[name]) {
                    this.requiresByName[name] = true;
                    this.requires.push(name);
                }
            },
            addBundle: function(bundle) {
                var bundleKey = bundle.getKey();
                
                if (!this.bundlesByKey[bundleKey]) {
                    this.bundlesByKey[bundleKey] = true;
                    this.bundles.push(bundle);
                }
            },
            getBundles: function() {
                return this.bundles;
            },
            
            getBundleKeys: function() {
                var bundleKeys = [];
                forEach(this.bundles, function(bundle) {
                    bundleKeys.push(bundle.getKey());
                });
                return bundleKeys;
            },
            
            hasRequires: function() {
                return this.requires.length > 0;
            },
            
            getRequires: function() {
                return this.requires;
            },
            forEachBundle: function(callback, thisObj) {
                forEach(this.bundles, callback, thisObj);
            },
            forEachRequire: function(callback, thisObj) {
                forEach(this.requires, callback, thisObj);
            }
        };
        
        /**
         *
         */
        var PageBundles = function(config) {

            this.pageName = config.pageName;
            this.pageBundleName = config.pageName.replace(/^[^A-Za-z0-9_\-\.]*/g, '');
            this.inPlaceDeploymentEnabled = config.inPlaceDeploymentEnabled === true;
            this.bundlingEnabled = config.bundlingEnabled !== false;
            this.sourceUrlResolver = config.sourceUrlResolver;
            this.enabledExtensions = config.enabledExtensions;
            this.packageManifest = config.packageManifest;
            this.checksumsEnabled = config.checksumsEnabled;
            this.context = config.context || {};

            this.bundleMappings = new BundleMappings(this.enabledExtensions);
            if (config.bundleMappings) {
                this.bundleMappings.setParentBundleMappings(config.bundleMappings);
            }

            this.bundleLookup = {};
            this.asyncBundleLookup = {};
            this.bundlesBySlot = {};
            this.bundleCount = 0;
            this.asyncRequiresByName = {};
        };
        
        PageBundles.prototype = {
            
            build: function() {
                var optimizer = require('raptor/optimizer'),
                    config = this.config,
                    bundleMappings = this.bundleMappings,
                    bundlingEnabled = this.bundlingEnabled,

                    // array of all asynchronous package manifests
                    asyncPackages = [],
                    deferred =promises.defer(),
                    isDone = false,
                    _this = this;
                
                function done() {
                    if (isDone) {
                        return;
                    }
                    
                    isDone = true;
                    if (deferred) {
                        deferred.resolve(_this);
                    }
                }

                function onError(e) {
                    if (isDone) {
                        return;
                    }

                    isDone = true;
                    deferred.reject(e);
                }

                // This map keeps track of which packages are NOT asynchronous
                var initialPageManifestsLookup = {};

                // STEP 1:
                // Put all of the dependencies into bundles and keep track of
                // packages that are asynchronous.
                var promise = optimizer.forEachDependency({
                    dependencies: this.dependencies,
                    packages: this.packageManifest,
                    recursive: true, //We want to make sure every single dependency is part of a bundle
                    enabledExtensions: this.enabledExtensions,
                    context: this.context,
                    handlePackage: function(manifest, context) {
                        if (context.async === true) {
                            asyncPackages.push(manifest); //We'll handle async dependencies later
                        }
                        else {
                            initialPageManifestsLookup[manifest.getName()] = true;
                        }
                    },
                    handleDependency: function(dependency, context) {
                        if (context.i18n && dependency.type === 'i18n') {
                            // i18n dependencies aren't actually real dependencies.
                            // These "dependencies" are post-processed to build an i18n module
                            // for each locale that is enabled.

                            // store reference to i18n dependency in the I18nContext
                            context.i18n.addDependency(dependency);
                            return;
                        }

                        var bundle = bundleMappings.getBundleForDependency(dependency);
                        if (!bundle) {
                            // this dependency has not been mapped to a bundle yet
                            var sourceResource = dependency.getResource();
                            
                            if (this.inPlaceDeploymentEnabled) {
                                //Create a bundle with a single dependency for each dependency
                                if (dependency.isInPlaceDeploymentAllowed() && sourceResource && sourceResource.exists()) {
                                    
                                    var sourceUrl;
                                    
                                    if (this.sourceUrlResolver) {
                                        sourceUrl = this.sourceUrlResolver(sourceResource.getFilePath());
                                    }
                                    
                                    if (!this.sourceUrlResolver || sourceUrl) {
                                        bundle = bundleMappings.addDependencyToBundle(dependency, sourceResource.getURL(), undefined, context.slot);
                                        if (sourceUrl) {
                                            bundle.url = sourceUrl;
                                        }
                                        bundle.sourceResource = sourceResource;
                                        bundle.sourceDependency = dependency;
                                        bundle.inPlaceDeployment = true;
                                    }
                                }
                            }

                            if (dependency.isExternalResource()) {
                                bundle = bundleMappings.addDependencyToBundle(dependency, dependency.getUrl(), undefined, context.slot);
                            }
                            
                            if (!bundle && (this.bundlingEnabled === false || this.inPlaceDeploymentEnabled)) {
                                var targetBundleName;
                                if (sourceResource) {
                                    if (this.checksumsEnabled) {
                                        targetBundleName = sourceResource.getName();
                                    }
                                    else {
                                        targetBundleName = sourceResource.getPath();
                                    }
                                }
                                else {
                                    targetBundleName = dependency.getKey();
                                }

                                bundle = bundleMappings.addDependencyToBundle(dependency, targetBundleName, undefined, context.slot);

                                
                                bundle.dependencySlotInUrl = false;
                                if (this.inPlaceDeploymentEnabled) {
                                    bundle.sourceResource = sourceResource;
                                    bundle.sourceDependency = dependency;
                                    if (!sourceResource) {
                                        bundle.requireChecksum = true;
                                    }
                                }
                                
                            }
                            
                            if (!bundle) {
                                //Make sure the dependency is part of a bundle. If it not part of a preconfigured bundle then put it in a page-specific bundle
                                bundle = bundleMappings.addDependencyToBundle(dependency, this.pageBundleName + (context.async ? "-async" : ""), undefined, context.slot);
                            }
                        }
                        
                        if (context.async === true) {
                            return; //Don't add bundles associated with async dependencies to the page bundles (those bundles will be added to the async metadata)
                        }
                        
                        // At this point we have added the dependency to a bundle and we know the bundle is not asynchronous
                        this.addBundleToSlot(bundle);
                    },
                    thisObj: this
                
                });
                
                // STEP 2:
                // Create localization bundles
                function buildLocalizationBundles() {
                    var deferred = promises.defer();

                    _this.context.i18n.buildBundles(_this, function(err, result) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            if (result) {
                                // add each asynchronous package to list of packages to load asynchronously
                                // (non-asynchronous packages will have already been added to output slots)
                                if (result.packages) {
                                    result.packages.forEach(function(i18nPackage) {
                                        if (i18nPackage.async) {
                                            asyncPackages.push(i18nPackage);
                                        }
                                    });
                                }
                            }
                            deferred.resolve();
                        }
                    });
                }

                var asyncRequires = this.asyncRequiresByName;
                
                function getAsyncRequire(name) {
                    var asyncRequire = asyncRequires[name];
                    if (!asyncRequire) {
                        asyncRequire = asyncRequires[name] = new AsyncRequire(name);
                    }
                    return asyncRequire;
                }

                // STEP 3:
                // Build asynchronous bundles
                function buildAsyncPageBundles() {
                    var promise = optimizer.forEachDependency({
                        packages: asyncPackages,
                        recursive: true, //We want to make sure we pull in all recursive dependencies for async bundles
                        enabledExtensions: _this.enabledExtensions,
                        context: _this.context,
                        handlePackage: function(manifest, context) {
                            if (!context.parentPackage) {
                                return;
                            }

                            if (initialPageManifestsLookup[manifest.getName()]) {
                                // this package was already handled because it is
                                // not asynchronous
                                return false;
                            }

                            getAsyncRequire(manifest.getName());
                            var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                            asyncRequire.addRequire(manifest.getName());
                            
                        },
                        handleDependency: function(dependency, context) {
                            
                            var bundle = bundleMappings.getBundleForDependency(dependency);

                            if (!bundle) {
                                throw raptor.createError(new Error('No bundle found for dependency "' + dependency + '"'));
                            }

                            var bundleKey = bundle.getKey();

                            if (!this.bundleLookup[bundleKey]) { //Check if this async dependency is part of a page bundle
                                //This bundle is an asynchronous only bundle
                                
                                if (!context.parentPackage) {
                                    throw raptor.createError(new Error("Illegal state. Asynchronous dependency is not part of a package"));
                                }

                                this.asyncBundleLookup[bundleKey] = bundle;
                                
                                var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                                asyncRequire.addBundle(bundle);
                                
                            }
                        },
                        thisObj: _this
                    
                    });

                    promise.then(done, onError);
                }

                if (this.context.i18n) {
                    promise = promise.then(buildLocalizationBundles, onError);
                }
                
                promise
                    .then(buildAsyncPageBundles)
                    .fail(onError);
                
                return deferred.promise;
            },
            
            addBundleToSlot: function(bundle) {
                /*
                 * Add the bundle to a page slot if it has not already been added
                 */
                var bundleLookupKey = bundle.getKey();
                
                if (!this.bundleLookup[bundleLookupKey]) {
                    this.bundleLookup[bundleLookupKey] = bundle;
                    
                    this.bundleCount++;
                    
                    var bundlesForSlot = this.bundlesBySlot[bundle.getSlot()];
                    if (!bundlesForSlot) {
                        bundlesForSlot = this.bundlesBySlot[bundle.getSlot()] = {
                           css: [],
                           js: []
                        };
                    }
                    
                    if (bundle.isJavaScript()) {
                        bundlesForSlot.js.push(bundle);
                    }
                    else if (bundle.isStyleSheet()){
                        bundlesForSlot.css.push(bundle);
                    }
                    else {
                        throw raptor.createError(new Error("Invalid content for bundle: " + bundle.getContentType()));
                    }
                }
            },

            getBundleMappings: function() {
                return this.bundleMappings;
            },
            
            forEachBundle: function(callback, thisObj) {
                forEachEntry(this.bundleLookup, function(bundleKey, bundle) {
                    callback.call(thisObj, bundle);
                }, this);
            },

            forEachAsyncBundle: function(callback, thisObj) {
                forEachEntry(this.asyncBundleLookup, function(bundleKey, bundle) {
                    callback.call(thisObj, bundle);
                }, this);
            },

            forEachBundleIter: function() {
                return this.forEachBundle.bind(this);
            },

            forEachAsyncBundleIter: function() {
                return this.forEachAsyncBundle.bind(this);
            },
            
            /*
             * This method is used to retrieve information about asynchronous
             * dependencies so that it can be added to loader metadata.
             */
            forEachAsyncRequire: function(callback, thisObj) {
                forEachEntry(this.asyncRequiresByName, function(name, asyncRequire) {
                    callback.call(thisObj, asyncRequire);
                });
            },
            
            hasAsyncRequires: function() {
                return !require('raptor/objects').isEmpty(this.asyncRequiresByName);
            },
            
            getBundleCount: function() {
                return this.bundleCount;
            },
            
            getPackageManifests: function() {
                return this.packageManifests;
            },
            
            setSourceUrlResolver: function(sourceUrlResolver) {
                this.sourceUrlResolver = sourceUrlResolver;
            }
        };
        
        return PageBundles;
    });
raptor.defineClass(
    "optimizer.PageBundles",
    function(raptor) {
        "use strict";
        
        var forEachEntry = raptor.forEachEntry,
            forEach = raptor.forEach,
            BundleMappings = raptor.require('optimizer.BundleMappings');
        
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
            this.sourceUrlResolver = config.sourceUrlResolver;
            this.packageManifest = config.packageManifest;
            this.bundleMappings = new BundleMappings(this.enabledExtensions);
            if (config.bundleMappings) {
                this.bundleMappings.setParentBundleMappings(config.bundleMappings);    
            }

            this.pageBundleLookup = {};
            this.bundlesBySlot = {};
            this.bundleCount = 0;
            this.asyncRequiresByName = {};
            this._build();
        };
        
        PageBundles.prototype = {
             
            _build: function() {
                var optimizer = raptor.require('optimizer'),
                    bundleMappings = this.bundleMappings,
                    asyncPackages = [];
                    
                optimizer.forEachDependency({
                    dependencies: this.dependencies,
                    packages: this.packageManifest,
                    recursive: true, //We want to make sure every single dependency is part of a bundle
                    enabledExtensions: this.enabledExtensions,
                    handlePackage: function(manifest, context) {
                        if (context.async === true) {
                            asyncPackages.push(manifest); //We'll handle async dependencies later
                        }
                    },
                    handleDependency: function(dependency, context) {

                        var bundle = bundleMappings.getBundleForDependency(dependency);
                        
                        if (!bundle) {
                            
                            var sourceResource = dependency.getResource();
                            
                            if (!this.bundlingEnabled) {
                                //Create a bundle with a single dependency for each dependency
                                if (this.inPlaceDeploymentEnabled && dependency.isInPlaceDeploymentAllowed() && sourceResource) {
                                    
                                    var sourceUrl;
                                    
                                    if (this.sourceUrlResolver) {
                                        sourceUrl = this.sourceUrlResolver(sourceResource.getSystemPath());
                                    }
                                    
                                    if (!this.sourceUrlResolver || sourceUrl) {
                                        bundle = bundleMappings.addDependencyToBundle(dependency, sourceResource.getSystemPath());
                                        if (sourceUrl) {
                                            bundle.url = sourceUrl;    
                                        }
                                        bundle.sourceResource = sourceResource;
                                        bundle.inPlaceDeployment = true;
                                    }
                                }
                                
                                if (!bundle) {
                                    bundle = bundleMappings.addDependencyToBundle(dependency, sourceResource ? sourceResource.getPath() : dependency.getKey());
                                    bundle.sourceResource = sourceResource;
                                    bundle.dependencySlotInUrl = false;
                                    if (!sourceResource) {
                                        bundle.requireChecksum = true;
                                    }
                                }
                            }
                            
                            if (!bundle) {
                                //Make sure the dependency is part of a bundle. If it not part of a preconfigured bundle then put it in a page-specific bundle
                                bundle = bundleMappings.addDependencyToBundle(dependency, this.pageBundleName + (context.async ? "-async" : ""));
                            }
                            
                        }
                        
                        if (context.async === true) {
                            return; //Don't add bundles associated with async dependencies to the page bundles (those bundles will be added to the async metadata)
                        }
                        /*
                         * Add the bundle to a page slot if it has not already been added
                         */
                        var bundleLookupKey = bundle.getKey();
                        
                        if (!this.pageBundleLookup[bundleLookupKey]) {
                            this.pageBundleLookup[bundleLookupKey] = bundle;
                            
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
                    thisObj: this
                
                });
                
                var asyncRequires = this.asyncRequiresByName,
                    getAsyncRequire = function(name) {
                        var asyncRequire = asyncRequires[name];
                        if (!asyncRequire) {
                            asyncRequire = asyncRequires[name] = new AsyncRequire(name);
                        }
                        return asyncRequire;
                    };
                    
                
                optimizer.forEachDependency({
                    packages: asyncPackages,
                    recursive: true, //We want to make sure we pull in all recursive dependencies for async bundles
                    enabledExtensions: this.enabledExtensions,
                    handlePackage: function(manifest, context) {
                        if (!context.parentPackage) {
                            return;
                        }
                    
                        
                        var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                        asyncRequire.addRequire(manifest.getName());
                        
                    },
                    handleDependency: function(dependency, context) {

                        var bundle = bundleMappings.getBundleForDependency(dependency),
                            bundleKey = bundle.getKey();
                        if (!this.pageBundleLookup[bundleKey]) { //Check if this async dependency is part of a page bundle
                            //This bundle is an asynchronous only bundle
                        
                            if (!context.parentPackage) {
                                throw raptor.createError(new Error("Illegal state. Asynchronous dependency is not part of a package"));
                            }
                            
                            var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                            asyncRequire.addBundle(bundle);
                            
                        }
                    },
                    thisObj: this
                
                });
                
                
            },
            
            getBundleMappings: function() {
                return this.bundleMappings;
            },
            
            forEachBundle: function(callback, thisObj) {
                forEachEntry(this.bundlesBySlot, function(slot, bundlesByContentType) {
                    
                    //Loop over CSS bundles first
                    forEach(bundlesByContentType.css, function(bundle) {
                        callback.call(thisObj, bundle, slot, "text/css");    
                    });
                    
                    //Followed by JS bundles for this slot
                    forEach(bundlesByContentType.js, function(bundle) {
                        callback.call(thisObj, bundle, slot, "application/javascript");    
                    });
                    
                }, this);
            },
            
            forEachAsyncRequire: function(callback, thisObj) {
                forEachEntry(this.asyncRequiresByName, function(name, asyncRequire) {
                    callback.call(thisObj, asyncRequire);
                });
            },
            
            hasAsyncRequires: function() {
                return !raptor.require('objects').isEmpty(this.asyncRequiresByName);
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
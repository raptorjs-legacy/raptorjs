raptor.defineClass(
    "packager.bundler.PageDependencies",
    function(raptor) {
        var forEachEntry = raptor.forEachEntry,
            forEach = raptor.forEach;
        
        var AsyncRequire = function(name) {
            this.name = name;
            this.requires = [];
            this.requiresByName = {}
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
                })
                return bundleKeys;
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
        
        var PageDependencies = function(pageName, options) {
            if (!options) {
                options = {};
            }

            this.pageName = pageName;
            this.includes = options.includes;
            this.bundleMappings = options.bundleMappings;
            this.enabledExtensions = options.enabledExtensions;

            this.pageBundleLookup = {};
            this.bundlesByLocation = {};
            this.bundleCount = 0;
            this.asyncRequiresByName = {};
            this._build();
        };
        
        PageDependencies.prototype = {
                
            _build: function() {
                var bundler = raptor.require('packager.bundler'),
                    bundleMappings = this.bundleMappings,
                    asyncIncludes = [];
                    
                bundler.forEachInclude({
                        includes: this.includes,
                        recursive: true, //We want to make sure every single include is part of a bundle
                        enabledExtensions: this.enabledExtensions,
                        handlePackageInclude: function(include, context) {
                            if (context.async === true) {
                                asyncIncludes.push(include); //We'll handle async includes later
                            }
                        },
                        handleInclude: function(include, context) {

                            var bundle = bundleMappings.getBundleForInclude(include);
                            if (!bundle) {
                                //Make sure the include is part of a bundle. If it not part of a preconfigured bundle then put it in a page-specific bundle
                                var targetBundleName = (context.async ? "page-async-" : "page-") + this.pageName; 
                                bundle = bundleMappings.addIncludeToBundle(include, targetBundleName);
                            }
                            
                            if (context.async === true) {
                                return; //Don't add bundles associated with async includes to the page bundles (those bundles will be added to the async metadata)
                            }
                            /*
                             * Add the bundle to a page slot if it has not already been added
                             */
                            var bundleLookupKey = bundle.getKey();
                            
                            if (!this.pageBundleLookup[bundleLookupKey]) {
                                this.pageBundleLookup[bundleLookupKey] = bundle;
                                
                                this.bundleCount++;
                                
                                var bundlesForLocation = this.bundlesByLocation[bundle.getLocation()];
                                if (!bundlesForLocation) {
                                    bundlesForLocation = this.bundlesByLocation[bundle.getLocation()] = {
                                       css: [],
                                       js: []
                                    };
                                }
                                
                                if (bundle.isJavaScript()) {
                                    bundlesForLocation.js.push(bundle);
                                }
                                else {
                                    bundlesForLocation.css.push(bundle);
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
                    
                
                bundler.forEachInclude({
                    includes: asyncIncludes,
                    recursive: true, //We want to make sure we pull in all recursive dependencies for async bundles
                    enabledExtensions: this.enabledExtensions,
                    handlePackageInclude: function(include, context) {
                        if (!context.parentPackage) {
                            return;
                        }
                    
                        var packageManifest = include.getManifest(),
                            parentPackageManifest = context;
                        
                        var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                        asyncRequire.addRequire(packageManifest.getName());
                        
                    },
                    handleInclude: function(include, context) {

                        var bundle = bundleMappings.getBundleForInclude(include),
                            bundleKey = bundle.getKey();
                        if (!this.pageBundleLookup[bundleKey]) { //Check if this async include is part of a page bundle
                            //This bundle is an asynchronous only bundle
                        
                            if (!context.parentPackage) {
                                raptor.throwError(new Error("Illegal state. Asynchronous include is not part of a package"));
                            }
                            
                            var asyncRequire = getAsyncRequire(context.parentPackage.getName());
                            asyncRequire.addBundle(bundle);
                            
                        }
                    },
                    thisObj: this
                
                });
            },
            
            forEachBundle: function(callback, thisObj) {
                forEachEntry(this.bundlesByLocation, function(location, bundlesByContentType) {
                    
                    //Loop over CSS bundles first
                    forEach(bundlesByContentType.css, function(bundle) {
                        callback.call(thisObj, bundle);    
                    });
                    
                    //Followed by JS bundles for this location
                    forEach(bundlesByContentType.js, function(bundle) {
                        callback.call(thisObj, bundle);    
                    });
                    
                }, this);
            },
            
            forEachAsyncRequire: function(callback, thisObj) {
                forEachEntry(this.asyncRequiresByName, function(name, asyncRequire) {
                    callback.call(thisObj, asyncRequire);
                });
            },
            
            getBundleCount: function() {
                return this.bundleCount;
            }
        };
        
        return PageDependencies;
    });
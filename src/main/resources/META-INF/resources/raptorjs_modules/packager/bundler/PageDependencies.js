raptor.defineClass(
    "packager.bundler.PageDependencies",
    function(raptor) {
        var forEachEntry = raptor.forEachEntry,
            forEach = raptor.forEach;
        
        var PageDependencies = function(pageName, options) {
            if (!options) {
                options = {};
            }

            this.pageName = pageName;
            this.includes = options.includes;
            this.bundleMappings = options.bundleMappings;
            this.enabledExtensions = options.enabledExtensions;

            this.bundleLookup = {};
            this.bundlesByLocation = {};
            this.bundleCount = 0;
            
            this._build();
        };
        
        PageDependencies.prototype = {
                
            _build: function() {
                var bundler = raptor.require('packager.bundler'),
                    bundleMappings = this.bundleMappings;

                var asyncRequires = [];
                    
                bundler.forEachInclude(
                    this.includes, 
                    this.enabledExtensions,
                    function(include) {
                        if (include.isPackageInclude()) {
                            return; //Ignore package includes
                        }
                        
                        var bundle = bundleMappings.getBundleForInclude(include);
                        if (!bundle) {
                            var targetBundleName = (include.async === true ? "page-async-" : "page-") + this.pageName; 
                            bundle = bundleMappings.addIncludeToBundle(include, targetBundleName);
                        }
                        
                        var bundleLookupKey = bundle.getKey();
                        
                        if (!this.bundleLookup[bundleLookupKey]) {
                            this.bundleLookup[bundleLookupKey] = bundle;
                            
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
                    this);
                
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
            
            getBundleCount: function() {
                return this.bundleCount;
            }
        };
        
        return PageDependencies;
    });
raptor.defineClass(
    "raptorjs-packager.BundleConfig",
    function(raptor) {
        var packaging = raptor.packaging,
            Bundle = raptor.require("raptorjs-packager.Bundle"),
            forEach = raptor.forEach,
            forEachEntry = raptor.forEachEntry;
        
        var BundleConfig = function() {
            this.includeToBundleMapping = {};
            this.nextBundleId = 0;
            this.bundles = [];
        };
        
        BundleConfig.prototype = {
            clone: function() {
                var clone = new BundleConfig();
                clone.includeToBundleMapping = raptor.extend({}, this.includeToBundleMapping);
                clone.nextBundleId = this.nextBundleId;
                clone.bundles = [].concat(this.bundles);
                return clone;
            },
            
            setBundleForInclude: function(include, bundle) {
                var includeHandler = packaging.getIncludeHandler(include.type);
                var key = includeHandler.includeKey(include);
                this.includeToBundleMapping[key] = bundle;
            },
            
            getBundleForInclude: function(include) {
                var includeHandler = packaging.getIncludeHandler(include.type);
                var key = includeHandler.includeKey(include);
                return this.includeToBundleMapping[key];
            },
            
            addBundles: function(bundles) {
                
                forEach(bundles, function(bundleConfig) {
                    this.addBundle("bundle-" + (bundleConfig.name || this.nextBundleId++), bundleConfig.includes);
                }, this);
            },
            
            addBundle: function(name, includes) {
                var bundle = this.createBundle(name);
                this.bundles.push(bundle);
                
                forEach(includes, function(include) {
                    bundle.addInclude(include);
                }, this);
                return bundle;
            },
            
            createBundle: function(name) {
                var bundle = new Bundle(this, name);
                this.bundles.push(bundle);
                return bundle;
            },
            
            forEachBundle: function(callback, thisObj) {
                forEach(this.bundles, callback, thisObj);
            },
            
            getUrls: function(includes, options) {
                var urls = {},
                    includedUrls = {},
                    _handleManifest,
                    _handleInclude;
                
                _handleManifest = function(manifest) {
                    manifest.forEachInclude({
                        callback: function(type, include) {
                            _handleInclude.call(this, include, manifest);
                        },
                        enabledExtensions: this.enabledExtensions,
                        thisObj: this
                    });
                };
                
                _handleInclude = function(include, manifest) {
                    var handler = packaging.getIncludeHandler(include.type);
                    
                    if (handler.isPackageInclude(include)) {
                        var manifest = handler.getManifest(include);
                        _handleManifest.call(this, manifest);
                    }
                    else {
                        var bundle = this.getBundleForInclude(include);
                        var contentTypes = bundle.getContentTypes();
                        forEach(contentTypes, function(contentType) {
                            var contentTypeUrls = urls[contentType];
                            if (!contentTypeUrls) {
                                contentTypeUrls = urls[contentType] = [];
                            }
                            
                            var url = this.getUrl(contentType, include, options);
                            if (url && !includedUrls[url]) {
                                includedUrls[url] = true;
                                contentTypeUrls.push(url);    
                            }
                        }, this);
                    }
                };
                
                forEach(includes, function(include) {
                    _handleInclude.call(this, include, null);
                }, this);
                
                return urls;
            },
            
            getUrl: function(contentType, include, options) {
                var bundle = this.getBundleForInclude(include);
                if (!bundle) {
                    throw new Error('Bundle not found for include "' + handler.includeKey(handler) + '"');
                }
                if (bundle.hasCode(contentType)) {
                    var url = bundle.getFilename(contentType, options);
                    return url;
                }
                else {
                    return null;
                }
                
            },
            
            getAsyncMetadata: function(includes, options) {
                if (!options) {
                    options = {};
                }
                
                var output = {},
                    _handleManifest,
                    hasMetadata = false,
                    excludedUrls = {},
                    _handleInclude,
                    _addUrl = function(contentType, include, metadata, includedUrls) {
                        var bundle = this.getBundleForInclude(include);
                        
                        var url = this.getUrl(contentType, include);
                        if (url && !includedUrls[url] && !excludedUrls[url]) {
                            includedUrls[url] = true;
                            if (!metadata[contentType]) {
                                metadata[contentType] = [];
                            }
                            metadata[contentType].push(url);
                        }
                    };
                if (options.excludeUrls) {
                    forEachEntry(options.excludeUrls, function(contentType, urls) {
                        forEach(urls, function(url) {
                            excludedUrls[url] = true; //Mark the URL as included so that it won't be included again
                        }, this);
                    }, this);
                }
                
                _handleManifest = function(manifest) {
                    if (output[manifest.name]) {
                        return;
                    }
                    hasMetadata = true;
                    
                    var metadata = output[manifest.name] = {},
                        includedUrls = {};
                    
                    manifest.forEachInclude({
                        callback: function(type, include) {                            
                            var handler = packaging.getIncludeHandler(include.type);
                            if (handler.isPackageInclude(include)) {
                                var manifest = handler.getManifest(include);
                                if (!metadata.requires) {
                                    metadata.requires = [];
                                }
                                
                                var requiredMetadata = _handleManifest.call(this, manifest);
                                if (raptor.keys(requiredMetadata).length !== 0){
                                    metadata.requires.push(manifest.name);
                                }
                            }
                            else {
                                _addUrl.call(this, "js", include, metadata, includedUrls);
                                _addUrl.call(this, "css", include, metadata, includedUrls);
                            }
                        },
                        enabledExtensions: this.enabledExtensions,
                        thisObj: this
                    });
                    
                    return metadata;
                };

                forEach(includes, function(include) {
                    var handler = packaging.getIncludeHandler(include.type);
                    
                    if (handler.isPackageInclude(include)) {
                        var manifest = handler.getManifest(include);
                        _handleManifest.call(this, manifest);
                    }
                    else {
                        raptor.throwError(new Error("Only packages are allowed. Invalid include: " + handler.includeKe(include)));
                    }
                }, this);
                
                console.log('ASYNC METADATA: ', output);
                
                return hasMetadata ? output : null;
            }
        };
        
        return BundleConfig;
    });
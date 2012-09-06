raptor.defineClass(
    "optimizer.BundleSet",
    function(raptor) {
        "use strict";
        
        var packager = raptor.require('packager'), 
            forEach = raptor.forEach,
            forEachEntry = raptor.forEachEntry,
            indent = function(level) {
                var str = "";
                for (var i=0; i<level; i++) {
                    str += " ";
                }
                return str;
            },
            leftPad = function(str, len) {
                while (str.length < len) {
                    str = " " + str;
                }
                return str;
            },
            getIncludeKey = function(include) {
                include = packager.createInclude(include);
                var slot = include.getSlot();
                if (!slot) {
                    slot = "body";
                }
                return slot + "/" + include.getKey();
            };
        
        var BundleSet = function(bundles, options) {
            
            
            if (bundles instanceof BundleSet) {
                this.parentBundleSet = bundles;
                options = {
                    enabledExtensions: bundles.enabledExtensions
                };
                
                bundles = null;
            }
            
            if (!options) {
                options = {};
            }
            
            
            this.enabledExtensions = options.enabledExtensions;
            this.includeToBundleMapping = {};
            this.bundlesByKey = {};
            
            forEach(bundles, function(bundle) {
                this.addBundle(bundle);
            }, this);
        };
        
        BundleSet.prototype = {

            getBundleForInclude: function(include) {
                var key = include.getKey();
                var bundle =  this.includeToBundleMapping[key];
                if (!bundle && this.parentBundleSet) {
                    bundle = this.parentBundleSet.getBundleForInclude(include);
                }
                return bundle;
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            addBundle: function(bundle) {
                var optimizer = raptor.require('optimizer');
                
                var includes = bundle.getIncludes();
                
                optimizer.forEachInclude({
                    includes: includes,
                    recursive: false,
                    enabledExtensions: this.enabledExtensions,
                    handlePackage: function(manifest, context) {

                        if (context.async === true) {
                            return false; //Ignore asynchronous includes since they should not be part of asynchronous bundles 
                        }
                        
                        if (context.recursive === true || context.depth === 0) {
                            this.logger().info(leftPad(bundle.name, 30) + ": " + indent(context.depth) + 'Adding includes for package "' + manifest.getPath() + '"');
                            return true; //Recurse into the package
                        }
                        else {
                            this.logger().info(leftPad(bundle.name, 30) + ": " + indent(context.depth) + "***Skipping nested package " + manifest.getPath() + ' for package "' + context.parentPackage.getPath() + '"');
                            return false;
                        }
                    },
                    handleInclude: function(include, context) {
                        if (context.async === true) {
                            throw raptor.createError(new Error("Illegal state. async should not be true"));
                        }
                        
                        if (this.getBundleForInclude(include)) {
                            return;
                        }
                        
                        this.addIncludeToBundle(include, bundle.name);
                        this.logger().info(leftPad(bundle.name, 30) + ": " + indent(context.depth) + 'Added "' + include.toString() + '"');
                        
                    },
                    thisObj: this
                });
            },
            
            addIncludeToBundle: function(include, targetBundleName) {
                include = packager.createInclude(include);
                
                if (include.isPackageInclude()) {
                    throw raptor.createError(new Error("Illegal argument. Include cannot be a package include. Include: " + include.toString()));
                }
                var includeSlot = include.getSlot();
                if (!includeSlot) {
                    includeSlot = "body";
                }
                
                
                var bundleKey = includeSlot + "/" + include.getContentType() + "/" + targetBundleName;
                var targetBundle = this.bundlesByKey[bundleKey];
                if (!targetBundle) {
                    targetBundle = raptor.require('optimizer').createBundle(targetBundleName);
                    targetBundle.setSlot(includeSlot);
                    targetBundle.setContentType(include.getContentType());
                    this.bundlesByKey[bundleKey] = targetBundle;
                }
                
                this.includeToBundleMapping[include.getKey()] = targetBundle;
                
                if (!include.isPackageInclude()) {
                    targetBundle.addInclude(include);
                }
                
                return targetBundle;
            }
        };
        
        return BundleSet;
    });
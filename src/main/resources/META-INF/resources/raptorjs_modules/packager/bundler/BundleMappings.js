raptor.defineClass(
    "packager.bundler.BundleMappings",
    function(raptor) {
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
                var location = include.getLocation();
                if (!location) {
                    location = "body";
                }
                return location + "/" + include.getKey();
            };
        
        var BundleMappings = function(bundles, options) {
            if (!options) {
                options = {};
            }
            
            this.name = options.name;
            this.enabledExtensions = options.enabledExtensions || [];
            this.includeToBundleMapping = {};
            this.bundlesByKey = {};
            
            forEach(bundles, function(bundle) {
                this.addBundle(bundle);
            }, this);
        };
        
        BundleMappings.prototype = {

            getBundleForInclude: function(include) {
                var key = include.getKey();
                return this.includeToBundleMapping[key];
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            addBundle: function(bundle) {
                var bundler = raptor.require('packager.bundler');
                
                var includes = bundle.getIncludes();
                
                bundler.forEachInclude(
                    includes, 
                    this.enabledExtensions,
                    function(include, recursive, depth, parentPackage) {
                        var key = include.getKey();
                        var existingBundle = this.includeToBundleMapping[key];
                        if (existingBundle) {
                            
                            return true; //Skip this include and don't recurse into nested dependencies
                        }
                        if (include.isPackageInclude()) {
                            
                            if (recursive === true) {
                                this.addIncludeToBundle(include, bundle.name);
                            }
                            
                            if (recursive === true || depth === 0) {
                                this.logger().info(leftPad(bundle.name, 30) + ": " + indent(depth) + 'Adding includes for package "' + include.getManifest().getPath() + '"');
                            }
                            else {
                                this.logger().info(leftPad(bundle.name, 30) + ": " + indent(depth) + "***Skipping nested package " + include.getManifest().getPath() + ' for package "' + parentPackage.getPath() + '"');
                                return true;
                            }
                        }
                        else {
                            this.addIncludeToBundle(include, bundle.name);
                            this.logger().info(leftPad(bundle.name, 30) + ": " + indent(depth) + 'Added "' + include.toString() + '"');
                        }
                        return false;
                        
                    },
                    this);
            },
            
            addIncludeToBundle: function(include, targetBundleName) {
                include = packager.createInclude(include);
                
                if (include.isPackageInclude()) {
                    raptor.throwError(new Error("Illegal argument. Include cannot be a package include. Include: " + include.toString()));
                }
                var includeLocation = include.getLocation();
                if (!includeLocation) {
                    includeLocation = "body";
                }
                
                
                var bundleKey = includeLocation + "/" + include.getContentType() + "/" + targetBundleName;
                var targetBundle = this.bundlesByKey[bundleKey];
                if (!targetBundle) {
                    targetBundle = raptor.require('packager.bundler').createBundle(targetBundleName);
                    targetBundle.setLocation(includeLocation);
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
        
        return BundleMappings;
    });
raptor.defineClass(
    "optimizer.BundleMappings",
    function(raptor) {
        "use strict";
        
        var packager = raptor.require('packager'), 
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
            };
        
        var BundleMappings = function(enabledExtensions) {
            this.enabledExtensions = enabledExtensions;
            this.includeToBundleMapping = {};
            this.bundlesByKey = {};
        };
        
        BundleMappings.prototype = {

            setParentBundleMappings: function(parentBundleMappings) {
                this.parentBundleMappings = parentBundleMappings;
            },
            
            getBundleForInclude: function(include) {
                var key = include.getKey();
                var bundle =  this.includeToBundleMapping[key];
                if (!bundle && this.parentBundleMappings) {
                    bundle = this.parentBundleMappings.getBundleForInclude(include);
                }
                return bundle;
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            addIncludesToBundle: function(includes, targetBundleName) {
                var optimizer = raptor.require('optimizer');
                
                optimizer.forEachInclude({
                    includes: includes,
                    enabledExtensions: this.enabledExtensions,
                    handlePackage: function(manifest, context) {

                        if (context.async === true) {
                            return false; //Ignore asynchronous includes since they should not be part of asynchronous bundles 
                        }
                        
                        if (context.recursive === true || context.depth === 0) {
                            this.logger().info(leftPad(targetBundleName) + ": " + indent(context.depth) + 'Adding includes for package "' + manifest.getPath() + '"');
                            return true; //Recurse into the package
                        }
                        else {
                            this.logger().info(leftPad(targetBundleName) + ": " + indent(context.depth) + "***Skipping nested package " + manifest.getPath() + ' for package "' + context.parentPackage.getPath() + '"');
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
                        
                        this.addIncludeToBundle(include, targetBundleName);
                        this.logger().info(leftPad(targetBundleName, 30) + ": " + indent(context.depth) + 'Added "' + include.toString() + '"');
                        
                    },
                    thisObj: this
                });
            },
            
            addIncludeToBundle: function(include, targetBundleName) {
                include = packager.createInclude(include);
                var Bundle = raptor.require('optimizer.Bundle');
                
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
                    targetBundle = new Bundle(targetBundleName);
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
        
        return BundleMappings;
    });
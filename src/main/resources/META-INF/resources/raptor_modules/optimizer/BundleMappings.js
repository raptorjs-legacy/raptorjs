raptor.defineClass(
    "optimizer.BundleMappings",
    function(raptor) {
        "use strict";
        
        var packaging = raptor.require('packaging'), 
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
            this.dependencyToBundleMapping = {};
            this.bundlesByKey = {};
        };
        
        BundleMappings.prototype = {

            setParentBundleMappings: function(parentBundleMappings) {
                this.parentBundleMappings = parentBundleMappings;
            },
            
            getBundleForDependency: function(dependency) {
                var key = dependency.getKey();
                var bundle =  this.dependencyToBundleMapping[key];
                if (!bundle && this.parentBundleMappings) {
                    bundle = this.parentBundleMappings.getBundleForDependency(dependency);
                }
                return bundle;
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            addDependenciesToBundle: function(dependencies, targetBundleName) {
                var optimizer = raptor.require('optimizer');
                
                optimizer.forEachDependency({
                    dependencies: dependencies,
                    enabledExtensions: this.enabledExtensions,
                    handlePackage: function(manifest, context) {

                        if (context.async === true) {
                            return false; //Ignore asynchronous dependencies since they should not be part of asynchronous bundles 
                        }
                        
                        if (context.recursive === true || context.depth === 0) {
                            this.logger().info(leftPad(targetBundleName) + ": " + indent(context.depth) + 'Adding dependencies for package "' + manifest.getPath() + '"');
                            return true; //Recurse into the package
                        }
                        else {
                            this.logger().info(leftPad(targetBundleName) + ": " + indent(context.depth) + "***Skipping nested package " + manifest.getPath() + ' for package "' + context.parentPackage.getPath() + '"');
                            return false;
                        }
                    },
                    handleDependency: function(dependency, context) {
                        if (context.async === true) {
                            throw raptor.createError(new Error("Illegal state. async should not be true"));
                        }
                        
                        if (this.getBundleForDependency(dependency)) {
                            return;
                        }
                        
                        this.addDependencyToBundle(dependency, targetBundleName);
                        this.logger().info(leftPad(targetBundleName, 30) + ": " + indent(context.depth) + 'Added "' + dependency.toString() + '"');
                        
                    },
                    thisObj: this
                });
            },
            
            addDependencyToBundle: function(dependency, targetBundleName) {
                dependency = packaging.createDependency(dependency);
                var Bundle = raptor.require('optimizer.Bundle');
                
                if (dependency.isPackageDependency()) {
                    throw raptor.createError(new Error("Illegal argument. Dependency cannot be a package dependency. Dependency: " + dependency.toString()));
                }
                var dependencySlot = dependency.getSlot();
                if (!dependencySlot) {
                    dependencySlot = "body";
                }
                
                
                var bundleKey = dependencySlot + "/" + dependency.getContentType() + "/" + targetBundleName;
                var targetBundle = this.bundlesByKey[bundleKey];
                if (!targetBundle) {
                    targetBundle = new Bundle(targetBundleName);
                    targetBundle.setSlot(dependencySlot);
                    targetBundle.setContentType(dependency.getContentType());
                    this.bundlesByKey[bundleKey] = targetBundle;
                }
                
                this.dependencyToBundleMapping[dependency.getKey()] = targetBundle;
                
                if (!dependency.isPackageDependency()) {
                    targetBundle.addDependency(dependency);
                }
                
                return targetBundle;
            }
        };
        
        return BundleMappings;
    });
define.Class(
    'raptor/optimizer/BundleMappings',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var logger = module.logger(),
            packaging = require('raptor/packaging'),
            promises = require('raptor/promises'),
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
        
        var BundleMappings = function(context) {
            context = context || {};
            this.context = context;
            this.enabledExtensions = context.enabledExtensions;
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
            
            addDependenciesToBundle: function(dependencies, targetBundleName, checksumsEnabled) {
                var optimizer = require('raptor/optimizer'),
                    _this = this;
                
                var promise = optimizer.forEachDependency({
                    context: this.context,
                    dependencies: dependencies,
                    enabledExtensions: this.enabledExtensions,
                    handlePackage: function(manifest, context) {
                        if (context.async === true) {
                            return false; //Ignore asynchronous dependencies since they should not be part of asynchronous bundles
                        }
                        
                        if (context.recursive === true || context.depth === 0) {
                            logger.info(leftPad(targetBundleName) + ": " + indent(context.depth) + 'Adding dependencies for package "' + manifest.getPath() + '"');
                            return true; //Recurse into the package
                        }
                        else {
                            logger.info(leftPad(targetBundleName) + ": " + indent(context.depth) + "***Skipping nested package " + manifest.getPath() + ' for package "' + context.parentPackage.getPath() + '"');
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
                        
                        var bundle = this.addDependencyToBundle(dependency, targetBundleName, checksumsEnabled, context.slot);
                        if (logger.isInfoEnabled()) {
                            logger.info(leftPad(bundle.getName(), 30) + ": " + indent(context.depth) + 'Added "' + dependency.toString() + '"');
                        }
                        
                    },
                    thisObj: this
                });

                var deferred = promises.defer();
                promise.then(
                    function() {
                        deferred.resolve(_this)
                    },
                    function(e) {
                        deferred.reject(e);
                    });

                return deferred.promise;
            },
            
            addDependencyToBundle: function(dependency, targetBundleName, checksumsEnabled, dependencySlot) {
                var targetBundle;

                dependency = packaging.createDependency(dependency);
                var Bundle = require('raptor/optimizer/Bundle');
                
                if (dependency.isPackageDependency()) {
                    throw raptor.createError(new Error("Illegal argument. Dependency cannot be a package dependency. Dependency: " + dependency.toString()));
                }
                
                var inline = dependency.inline === true;



                var bundleKey = dependencySlot + "/" + dependency.getContentType() + "/" + inline + "/" + targetBundleName;
                targetBundle = this.bundlesByKey[bundleKey];

                if (!targetBundle) {
                    targetBundle = new Bundle(targetBundleName);
                    targetBundle.checksumsEnabled = checksumsEnabled;
                    targetBundle.setInline(inline);
                    targetBundle.setSlot(dependencySlot);
                    targetBundle.setContentType(dependency.getContentType());
                    targetBundle.setUrl(dependency.url);
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
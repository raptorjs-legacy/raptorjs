var util = require('util');

define.Class(
    "raptor/optimizer/OptimizerWriter",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var logger = module.logger(),
            promises = require('raptor/promises'), 
            listeners = require('raptor/listeners');
        
        var FileUrlBuilder = require('raptor/optimizer/FileUrlBuilder');

        var OptimizerWriter = function(pageOptimizer) {
            listeners.makeObservable(this, OptimizerWriter.prototype, ['bundleWritten']);
            var config = pageOptimizer.getConfig();
            this.pageOptimizer = pageOptimizer;
            this.config = config;
            this.context = null;
            this.inPlaceUrlBuilder = new FileUrlBuilder(config);
        };
        
        OptimizerWriter.prototype = {
            getConfig: function() {
                return this.config;
            },
            
            writeBundles: function(iteratorFunc, onBundleWrittenCallback) {

                var promisesArray = [];
                var _this = this;

                var deferred = promises.defer();

                function onError(e) {

                    deferred.reject(e);
                }

                function onBundleFinished(bundle) {
                    if (onBundleWrittenCallback) {
                        onBundleWrittenCallback(bundle);
                    }

                    _this.publish('bundleWritten', {
                        bundle: bundle
                    });
                }

                iteratorFunc(function(bundle) {

                    if (bundle.isWritten()) {
                        logger.info("Bundle (" + bundle.getKey() + ") already written to disk. Skipping...");
                        onBundleFinished(bundle);
                        return;
                    }

                    if (bundle.inPlaceDeployment === true) {
                        var basePath = _this.context.basePath || _this.config.getBasePath();
                        bundle.setUrl(_this.inPlaceUrlBuilder.buildBundleUrl(bundle, basePath));
                        onBundleFinished(bundle);
                        return;
                    }

                    if (bundle.getUrl()) {
                        onBundleFinished(bundle);
                        return;
                    }

                    var startTime = Date.now();
                    var promise = bundle.writePromise;
                    if (!promise) { // Only write the bundle once
                        if (bundle.isInline()) {
                            // For inline bundles, we won't actually write the bundle, but we will
                            // read the code for the bundle (with filters applied) and then
                            // store the resulting code with the bundle itself
                            promise = _this.pageOptimizer.readBundle(bundle, _this.context)
                                .then(function(code) {
                                    bundle.setCode(code); // Store the code with the bundle
                                })
                        }
                        else {
                            promise = _this.writeBundle(bundle);
                        }
                        
                        bundle.writePromise = promise;
                        promise.then(
                            function() {
                                bundle.setWritten(true);
                                if (bundle.isInline()) {
                                    logger.info('Code for inline bundle ' + bundle.getLabel() + ' generated in ' + (Date.now() - startTime) + 'ms');
                                }   
                                else {
                                    logger.info('Bundle ' + bundle.getLabel() + ' written to disk in ' + (Date.now() - startTime) + 'ms');    
                                }
                                
                                onBundleFinished(bundle);
                            },
                            onError);
                    }

                    promisesArray.push(promise);
                });

                promises.all(promisesArray)
                    .then(
                        function() {
                            deferred.resolve();
                        },
                        onError);

                return deferred.promise;
            },
            
            writeBundle: function(bundle) {
                throw raptor.createError(new Error("writeBundle() not implemented"));
            },

            writeResource: function(resource) {
                throw raptor.createError(new Error("writeResource() not implemented"));
            },

            setContext: function(context) {
                this.context = context;
            },

            getContext: function() {
                return this.context;
            }
        };

        
        return OptimizerWriter;
    });
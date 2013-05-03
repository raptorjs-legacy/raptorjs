var util = require('util');

define(
    "raptor/optimizer/OptimizerWriterMixins",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var logger = module.logger(),
            promises = require('raptor/promises'), 
            listeners = require('raptor/listeners');
        
        var FileUrlBuilder = require('raptor/optimizer/FileUrlBuilder');

        var OptimizerWriterMixins = function() {
            this.inPlaceUrlBuilder = new FileUrlBuilder(this.getConfig());
        };

        OptimizerWriterMixins.addMixins = function(writer) {
            var targetProto = writer.constructor ? writer.constructor.prototype : writer;
            if (targetProto === Object.prototype) {
                throw new Error('"constructor" property not set correctly for writer');
            }

            if (writer.__OptimizerWriterMixins !== true) {
                // Apply the mixins from OptimizerWriterMixins to the provided writer's prototype
                raptor.extend(targetProto, OptimizerWriterMixins.prototype);
            }   
            listeners.makeObservable(writer, targetProto, ['bundleWritten']);
            OptimizerWriterMixins.call(writer);
        };
        
        OptimizerWriterMixins.prototype = {
            __OptimizerWriterMixins: true,

            getConfig: function() {
                return this.config;
            },
            
            setConfig: function(config) {
                this.config = config;
            },

            setPageOptimizer: function(pageOptimizer) {
                this.pageOptimizer = pageOptimizer;
            },

            getPageOptimizer: function() {
                return this.pageOptimizer;
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

                    logger.info('Writing bundle: "' + bundle.getKey() + '"...');

                    if (bundle.inPlaceDeployment === true) {
                        bundle.setUrl(_this.inPlaceUrlBuilder.buildBundleUrl(bundle, _this.context));
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
                                .then(function(bundleInfo) {
                                    bundle.setCode(bundleInfo.code); // Store the code with the bundle
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

            setContext: function(context) {
                this.context = context;
            },

            getContext: function() {
                return this.context;
            }
        };

        
        return OptimizerWriterMixins;
    });
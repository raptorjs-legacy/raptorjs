define.Class(
    'raptor/optimizer/OptimizerFileWriter',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var File = require('raptor/files/File'),
            logger = module.logger(),
            promises = require('raptor/promises'),
            FileUrlBuilder = require('raptor/optimizer/FileUrlBuilder');
        
        var OptimizerFileWriter = function(pageOptimizer) {
            var config = pageOptimizer.getConfig();
            this.pageOptimizer = pageOptimizer;
            this.config = config;
            this.outputDir = config.getOutputDir();
            this.urlPrefix = config.getUrlPrefix();
            this.setUrlBuilder(this.createUrlBuilder());
        };
        
        OptimizerFileWriter.prototype = {
            createUrlBuilder: function() {
                return new FileUrlBuilder(this.config);
            },
            
            getBundleOutputDir: function(bundle) {
                return this.getOutputDir();
            },

            getOutputDir: function() {
                return this.config.getOutputDir();
            },
            
            writeBundle: function(bundle, context) {
                var deferred = promises.defer();
                var config = this.config;
                

                var checksumsEnabled = bundle.checksumsEnabled;
                if (checksumsEnabled === undefined) {
                    // checksumsEnabled not set for bundle so check optimizer config
                    checksumsEnabled = (this.config.checksumsEnabled !== false) || bundle.requireChecksum;
                }

                checksumsEnabled = checksumsEnabled === true;

                var pageOptimizer = this.pageOptimizer;
                var urlBuilder = this.getUrlBuilder();
                var startTime = new Date().getTime();
                var outputDir = this.getBundleOutputDir(bundle);
                var _this = this;
                var outputFile;

                if (!urlBuilder) {
                    throw raptor.createError(new Error("URL builder not set."));
                }

                if (!checksumsEnabled) {
                    outputFile = new File(outputDir, urlBuilder.getBundleFilename(bundle, context));
                    bundle.outputFile = outputFile.getAbsolutePath();
                    bundle.urlBuilder = urlBuilder;

                    if (bundle.sourceDependency && outputFile.exists() && bundle.sourceDependency.hasModifiedChecksum()) {
                        logger.info('Bundle "' + outputFile.getAbsolutePath() + '" written to disk is up-to-date. Skipping...');
                        return require('raptor/promises').resolved();
                    }
                    else if (bundle.sourceResource && outputFile.exists() && outputFile.lastModified() > bundle.sourceResource.lastModified()) {
                        logger.info('Bundle "' + outputFile.getAbsolutePath() + '" written to disk is up-to-date. Skipping...');
                        return require('raptor/promises').resolved();
                    }
                }

                

                function onError(e) {
                    deferred.reject(e);
                }

                try
                {
                    var readBundlePromise = pageOptimizer.readBundle(bundle, context);
                    readBundlePromise
                        .then(function(bundleInfo) {
                            var code = bundleInfo.code;
                            var checksum = bundleInfo.checksum;
                            bundle.setChecksum(checksum);

                            if (!outputFile) {
                                // Now that we have update the bundle with a checksum, we can
                                outputFile = new File(outputDir, urlBuilder.getBundleFilename(bundle));
                            }


                            bundle.outputFile = outputFile.getAbsolutePath();
                            bundle.urlBuilder = urlBuilder;

                            logger.info('Writing bundle file to "' + outputFile.getAbsolutePath() + '"...');
                            _this.writeBundleFile(outputFile, code, bundle);
                            deferred.resolve();
                        })
                        .fail(onError);

                    
                }
                catch(e) {
                    onError(e);
                }

                return deferred.promise;
            },

            writeBundleFile: function(outputFile, code, bundle) {
                var pageOptimizer = this.pageOptimizer,
                    wrappers = pageOptimizer.bundleWrappers;

                if (wrappers) {
                    // there are bundle wrappers but we now need to find out
                    // which ones are enabled
                    var prefix = [],
                        suffix = [];
                    
                    for (var i = 0; i < wrappers.length; i++) {
                        var wrapper = wrappers[i];
                        if (pageOptimizer.isWrapperEnabledForBundle(wrapper, bundle)) {
                            if (wrapper.prefix) {
                                prefix.push(wrapper.prefix);
                            }
                            if (wrapper.suffix) {
                                suffix.push(wrapper.suffix);
                            }
                        }
                    }

                    // the prefixes should be written in opposite order so that
                    // each prefix lines up with its suffix
                    prefix.reverse();

                    // add the wrappers to the code
                    code = prefix.join('') + code + suffix.join('');
                }

                outputFile.writeAsString(code, "UTF-8");
            },

            writeResource: function(resource, context) {
                var deferred = promises.defer();
                var pageOptimizer = this.pageOptimizer;
                var _this = this;
                context = context || {};

                try
                {
                    if (!resource) {
                        throw raptor.createError(new Error('"resource" argument is required'));
                    }

                    if (typeof resource === 'string') {
                        var resourcePath = resource;
                        resource = require('raptor/resources').findResource(resourcePath);
                        if (!resource || !resource.exists()) {
                            throw raptor.createError(new Error('Resource not found with path "' + resourcePath + '"'));
                        }
                    }

                    var data = resource.readAsBinary();
                    var filename = resource.getName();
                    
                    var outputDir = this.getOutputDir(),
                        outputFile,
                        checksum;

                    var checksumsEnabled = this.config.checksumsEnabled !== false;
                    if (checksumsEnabled) {
                        checksum = pageOptimizer.calculateChecksum(data);
                        var lastDot = filename.lastIndexOf('.');
                        if (lastDot !== -1) {
                            var nameNoExt = filename.substring(0, lastDot);
                            var ext = filename.substring(lastDot+1);
                            filename = nameNoExt + "_" + checksum + "." + ext;
                        }
                        else {
                            filename += "_" + checksum;
                        }
                    }

                    outputFile = new File(outputDir, filename);

                    outputFile.writeAsBinary(data);

                    deferred.resolve({
                        file: outputFile,
                        filename: filename,
                        checksum: checksum,
                        url: _this.getResourceUrl(filename, context),
                        buffer: data
                    });
                }
                catch(e) {
                    deferred.reject(e);
                }
                return deferred.promise;
            },

            getResourceUrl: function(filename, context) {
                var urlBuilder = this.getUrlBuilder();
                if (!urlBuilder) {
                    throw new Error("URL builder not set.");
                }

                context = context || {};

                return urlBuilder.buildResourceUrl(filename, context);
            },
            
            setUrlBuilder: function(urlBuilder) {
                this.urlBuilder = urlBuilder;
            },
            
            getUrlBuilder: function() {
                return this.urlBuilder;
            }
        };

        
        return OptimizerFileWriter;
    });
define.Class(
    'raptor/optimizer/OptimizerFileWriter',
    'raptor/optimizer/OptimizerWriter',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var File = require('raptor/files/File'),
            logger = module.logger(),
            promises = require('raptor/promises'),
            FileUrlBuilder = require('raptor/optimizer/FileUrlBuilder');
        
        var OptimizerFileWriter = function(pageOptimizer) {
            OptimizerFileWriter.superclass.constructor.call(this, pageOptimizer);
            var config = pageOptimizer.getConfig();
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
                return this.getConfig().getOutputDir();
            },
            
            writeBundle: function(bundle) {
                var deferred = promises.defer();

                

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

                if (!checksumsEnabled) {
                    outputFile = new File(outputDir, urlBuilder.getBundleFilename(bundle));
                    bundle.outputFile = outputFile.getAbsolutePath();
                    bundle.setUrl(this.getBundleUrl(bundle));
                    if (bundle.sourceResource && outputFile.exists() && outputFile.lastModified() > bundle.sourceResource.lastModified()) {
                        logger.info('Bundle "' + outputFile.getAbsolutePath() + '" written to disk is up-to-date. Skipping...');
                        return require('raptor/promises').resolved();
                    }
                }

                

                function onError(e) {
                    deferred.reject(e);
                }

                try
                {
                    var readBundlePromise = pageOptimizer.readBundle(bundle, this.context);
                    readBundlePromise.then(
                            function(code) {
                                try
                                {
                                    if (checksumsEnabled) {
                                        bundle.setChecksum(pageOptimizer.calculateChecksum(code));
                                    }

                                    if (!outputFile) {
                                        // Now that we have update the bundle with a checksum, we can 
                                        outputFile = new File(outputDir, urlBuilder.getBundleFilename(bundle));
                                    }


                                    bundle.outputFile = outputFile.getAbsolutePath();
                                    bundle.setUrl(_this.getBundleUrl(bundle));

                                    logger.info('Writing bundle file to "' + outputFile.getAbsolutePath() + '"...');
                                    _this.writeBundleFile(outputFile, code);
                                    deferred.resolve();
                                }
                                catch(e) {
                                    onError(e);
                                }
                                    
                            },
                            onError);

                    
                }
                catch(e) {
                    onError(e);
                }

                return deferred.promise;
            },

            writeBundleFile: function(outputFile, code) {
                outputFile.writeAsString(code, "UTF-8");
            },

            writeResource: function(resource) {
                var deferred = promises.defer();
                var pageOptimizer = this.pageOptimizer;
                var _this = this;

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
                        url: _this.getResourceUrl(filename),
                        buffer: data
                    });
                }
                catch(e) {
                    deferred.reject(e);
                }
                return deferred.promise;      
            },

            getBundleUrl: function(bundle) {
                if (bundle.url) {
                    return bundle.url;
                }
                
                var urlBuilder = this.getUrlBuilder();
                if (!urlBuilder) {
                    throw raptor.createError(new Error("URL builder not set."));
                }

                var basePath = this.context.basePath || this.config.getBasePath();
                return urlBuilder.buildBundleUrl(bundle, basePath);
            },


            getResourceUrl: function(filename) {
                var urlBuilder = this.getUrlBuilder();
                if (!urlBuilder) {
                    throw new Error("URL builder not set.");
                }

                var basePath = this.context.basePath || this.config.getBasePath();
                return urlBuilder.buildResourceUrl(filename, basePath);
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
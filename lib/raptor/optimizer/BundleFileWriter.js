define.Class(
    'raptor/optimizer/BundleFileWriter',
    'raptor/optimizer/BundleWriter',
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var File = require('raptor/files/File'),
            logger = module.logger(), 
            listeners = require('raptor/listeners');
        
        var BundleFileWriter = function(config, urlBuilder) {
            BundleFileWriter.superclass.constructor.call(this, config, urlBuilder);
            listeners.makeObservable(this, BundleFileWriter.prototype, ['bundleWritten']);
        };
        
        BundleFileWriter.prototype = {
            
            getFileExtension: function(contentType) {
                if (contentType === 'application/javascript') {
                    return 'js';
                }
                else if (contentType === 'text/css') {
                    return 'css';
                }
                else {
                    throw raptor.createError(new Error("Unsupported content type: " + contentType));
                }
            },
            
            getBundleFilename: function(bundle) {
                return this.getUrlBuilder().getBundleFilename(bundle);
            },
            
            getBundleOutputDir: function(bundle) {
                return this.getOutputDir();
            },

            getOutputDir: function() {
                return this.getConfig().getOutputDir();
            },
            
            writeBundle: function(bundle) {
                var startTime = new Date().getTime();
                var outputDir = this.getBundleOutputDir(bundle),
                    _this = this;
                var outputFile = new File(outputDir, this.getBundleFilename(bundle));

                bundle.outputFile = outputFile.getAbsolutePath();

                
                if (bundle.sourceResource && outputFile.exists() && outputFile.lastModified() > bundle.sourceResource.lastModified()) {
                    logger.info('Bundle "' + outputFile.getAbsolutePath() + '" written to disk is up-to-date. Skipping...');
                    return;
                }
                else {
                    logger.info('Writing bundle file "' + outputFile.getAbsolutePath() + '" to disk...');
                }

                this.writeBundleFile(outputFile, bundle.getCode(), bundle.getChecksum(), bundle);
            },
            
            writeBundleFile: function(outputFile, code, checksum, bundle) {
                logger.info('Writing bundle file to "' + outputFile.getAbsolutePath() + '"...');
                outputFile.writeAsString(code, "UTF-8");
                this.publish('bundleWritten', {
                    bundle: bundle,
                    file: outputFile,
                    code: code,
                    checksum: checksum
                });
            },
            
            rewriteBundle: function(path, bundle) {
                var bundleData = this.readBundle(bundle, this.context);
                this.writeBundleFile(path, bundleData.code, bundleData.checksum, bundle);    
            },

            writeResource: function(resource, addChecksum) {
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
                
                var contentType = require('raptor/mime').lookup(filename);

                var outputDir = this.getOutputDir(),
                    outputFile,
                    checksum;

                
                if (addChecksum !== false) {
                    checksum = this.calculateChecksum(data);
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

                return {
                    file: outputFile,
                    filename: filename,
                    checksum: checksum,
                    url: this.getResourceUrl(filename, outputDir.toString())
                };
            }
        };

        
        return BundleFileWriter;
    });
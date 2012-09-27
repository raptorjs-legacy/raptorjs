raptor.defineClass(
    "optimizer.PageDependenciesFileWriter",
    "optimizer.PageDependenciesWriter",
    function(raptor) {
        "use strict";
        
        var files = raptor.require('files'),
            File = files.File,
            listeners = raptor.require('listeners');
        
        var PageDependenciesFileWriter = function(config) {
            PageDependenciesFileWriter.superclass.constructor.call(this, config);
            listeners.makeObservable(this, PageDependenciesFileWriter.prototype, ['bundleWritten']);
        };
        
        PageDependenciesFileWriter.prototype = {
            
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
                return this.getOutputDirForContentType(bundle.getContentType());
            },

            getOutputDirForContentType: function(contentType) {
                
                if (contentType === 'application/javascript') {
                    return this.getConfig().getScriptsOutputDir();
                }
                else if (contentType === 'text/css') {
                    return this.getConfig().getCssOutputDir();
                }
                else {
                    return this.getConfig().getResourcesOutputDir();
                }
            },
            
            writeBundle: function(bundle) {
                var outputDir = this.getBundleOutputDir(bundle),
                    outputPath = files.joinPaths(outputDir, this.getBundleFilename(bundle)),
                    _this = this;
                
                var outputFile = new File(outputPath);
                
                if (bundle.sourceResource && outputFile.exists() && outputFile.lastModified() > bundle.sourceResource.getFile().lastModified()) {
                    _this.logger().info('Bundle "' + outputFile.getAbsolutePath() + '" written to disk is up-to-date. Skipping...');
                    return;
                }
                
                this.writeBundleFile(outputFile, bundle.getCode(), bundle.getChecksum(), bundle);
            },
            
            writeBundleFile: function(outputFile, code, checksum, bundle) {
                this.logger().info('Writing bundle file to "' + outputFile.getAbsolutePath() + '"...');
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
                    resource = raptor.require('resources').findResource(resourcePath);
                    if (!resource || !resource.exists()) {
                        throw raptor.createError(new Error('Resource not found with path "' + resourcePath + '"'));
                    }
                }

                var data = resource.readAsBinary();
                var filename = resource.getName();
                
                var contentType = raptor.require('mime').lookup(filename);

                var outputDir = this.getOutputDirForContentType(),
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
                    url: this.getResourceUrl(filename, contentType)
                };
            }
        };

        
        return PageDependenciesFileWriter;
    });
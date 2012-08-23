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
            
            getScriptsOutputDir: function(bundle) {
                return this.scriptsOutputDir || this.bundlesOutputDir || this.outputDir;
            },
            
            getStyleSheetsOutputDir: function(bundle) {
                return this.styleSheetsOutputDir || this.bundlesOutputDir || this.outputDir;
            },
            
            getHtmlOutputDir: function(bundle) {
                return this.htmlOutputDir || this.outputDir;
            },
            
            getFileExtension: function(contentType) {
                if (contentType === 'application/javascript') {
                    return 'js';
                }
                else if (contentType === 'text/css') {
                    return 'css';
                }
                else {
                    raptor.throwError(new Error("Unsupported content type: " + contentType));
                    return null;
                }
            },
            
            getBundleFilename: function(bundle) {
                return this.getUrlBuilder().getBundleFilename(bundle);
            },
            
            getBundleOutputDir: function(bundle) {
                var contentType = bundle.getContentType();
                
                if (contentType === 'application/javascript') {
                    return this.getScriptsOutputDir();
                }
                else if (contentType === 'text/css') {
                    return this.getStyleSheetsOutputDir();
                }
                else {
                    raptor.throwError(new Error("Unsupported content type: " + contentType));
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
                outputFile.writeFully(code, "UTF-8");
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
            }
        };

        
        return PageDependenciesFileWriter;
    });
raptor.defineClass(
    "optimizer.PageDependenciesFileWriter",
    "optimizer.PageDependenciesWriter",
    function(raptor) {
        "use strict";
        
        var files = raptor.require('files'),
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
                }
            },
            
            getBundleFilename: function(bundle, checksum) {
                return this.getUrlBuilder().getBundleFilename(bundle, checksum);
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
            
            writeBundle: function(bundle, code, checksum) {
                var outputDir = this.getBundleOutputDir(bundle);
                var outputPath = files.joinPaths(outputDir, this.getBundleFilename(bundle, checksum));
                
                this.writeBundleFile(outputPath, code, checksum, bundle);
            },
            
            writeBundleFile: function(path, code, checksum, bundle) {
                this.logger().info('Writing bundle file to "' + path + '"...');
                var outputFile = new files.File(path);
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
raptor.defineClass(
    "optimizer.PageDependenciesFileWriter",
    "optimizer.PageDependenciesWriter",
    function(raptor) {
        "use strict";
        
        var files = raptor.require('files');
        
        var PageDependenciesFileWriter = function(config) {
            PageDependenciesFileWriter.superclass.constructor.call(this, config);
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
                this.logger().info('Writing bundle file to "' + outputPath + '"...');
                this.writeBundleFile(outputPath, code, checksum);
            },
            
            writeBundleFile: function(path, code, checksum) {
                var outputFile = new files.File(path);
                outputFile.writeFully(code, "UTF-8");
            },
            
            getPageIncludeFilename: function(pageName, location) {
                
                return pageName + "-" + location + ".html";
            },
            
            
            writePageIncludeHtml: function(pageName, location, html) {
                var outputDir = this.getHtmlOutputDir();
                var outputPath = files.joinPaths(outputDir, this.getPageIncludeFilename(pageName, location));
                this.logger().info('Writing HTML include for page "' + pageName + '" to "' + outputPath + '"...');
                this.writePageIncludeHtmlFile(outputPath, html);
            },
            
            writePageIncludeHtmlFile: function(path, html) {
                
                var outputFile = new files.File(path);
                outputFile.writeFully(html, "UTF-8");
            }
        };

        
        return PageDependenciesFileWriter;
    });
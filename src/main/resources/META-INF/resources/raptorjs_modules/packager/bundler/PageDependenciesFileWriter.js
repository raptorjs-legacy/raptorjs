raptor.defineClass(
    "packager.bundler.PageDependenciesFileWriter",
    "packager.bundler.PageDependenciesWriter",
    function(raptor) {
        
        var files = raptor.require('files');
        
        var PageDependenciesFileWriter = function(config) {
            PageDependenciesFileWriter.superclass.constructor.call(this, config);
        };
        
        PageDependenciesFileWriter.prototype = {
            
            getOutputDir: function(bundle) {
                return this.outputDir;
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
            
            writeBundle: function(bundle, code, checksum) {
                var outputDir = this.getOutputDir();
                var outputPath = files.joinPaths(outputDir, this.getBundleFilename(bundle, checksum));
                this.writeBundleFile(outputPath, code, checksum);
            },
            
            writeBundleFile: function(path, code, checksum) {
                files.writeFully(path, code, "UTF-8");
            },
            
            getPageIncludeFilename: function(pageName, location) {
                return pageName + "-" + location + ".html";
            },
            
            writePageIncludeHtml: function(pageName, location, html) {
                var outputDir = this.getOutputDir();
                var outputPath = files.joinPaths(outputDir, this.getPageIncludeFilename(pageName, location));
                this.writePageIncludeHtmlFile(outputPath, html);
            },
            
            writePageIncludeHtmlFile: function(path, html) {
                files.writeFully(path, html, "UTF-8");
            }
        };

        
        return PageDependenciesFileWriter;
    });
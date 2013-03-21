var File = require('raptor/files/File'),
    templating = require('raptor/templating');

var Publisher = function(config) {
    this.pagesDir = config.pagesDir;
    this.modulesDir = config.modulesDir;
    this.outputDir = config.outputDir;
    this.urlsIncludeFilename = config.urlsIncludeFilename;
};

Publisher.prototype = {
    publishAllPages: function() {
        require('raptor/files/walker').walk(
            this.pagesDir, 
            function(file) {
                if (file.isFile() && file.getExtension() === "rhtml" && file.getName().startsWith('index')) {
                    this._writePage(file);
                }
            },
            this);
    },

    publishPage: function(pagePath) {
        var pageDir = new File(this.pagesDir, pagePath);
        var dirFiles = pageDir.listFiles();
        for (var i=0, len=dirFiles.length; i<len; i++) {
            var file = dirFiles[i];
            if (file.getName().startsWith('index-') && file.getName().endsWith('.rhtml')) {
                this._writePage(file);
                return;
            }
        }

        throw new Error('Invalid page: ' + pagePath);    
    },

    _writePage: function(templateFile) {
        var relativePath = templateFile.getParent().substring(this.pagesDir.length);
        var pathParts = relativePath.substring(1).split(/[\/\\]/)
        var pageName = pathParts.join('-');
        var outputFile = new File(this.outputDir, relativePath + '/index.html');

        console.log('Writing page "' + (relativePath || "/") + '" to "' + outputFile + '"...');

        this.currentOutputDir = outputFile.getParentFile();

        var controllerFile = new File(templateFile.getParentFile(), "index.js");
        var viewModel = null;
        if (controllerFile.exists()) {
            viewModel = require(controllerFile.getAbsolutePath()).controller();
        }

        viewModel = viewModel || {};
        viewModel.pageName = pageName;
        viewModel.pageOutputPath = outputFile.getParent();

        var templateResourcePath = templateFile.getAbsolutePath().slice(this.modulesDir.length);

        var output = templating.renderToString(templateResourcePath, viewModel);
        outputFile.writeAsString(output);

        this.currentOutputDir = null;
    }
};

exports.createPublisher = function(config) {
    return new Publisher(config);
}
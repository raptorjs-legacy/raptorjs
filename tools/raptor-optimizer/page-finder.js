var PageDef = require('./PageDef.js'),
    packager = raptor.require('packager');

exports.findPages = function(config) {
    if (config.hasPageSearchPath()) {
        config.forEachPageSearchPathEntry(function(searchPathEntry) {
            if (searchPathEntry.type === 'dir') {
                raptor.require('files.walker').walk(
                    searchPathEntry.path, 
                    function(file) {
                        if (file.isFile()) {
                            
                            var pageName,
                                pageFile,
                                filename = file.getName(),
                                isPage;
                            
                            if (filename === 'package.json') {
                                var dir = file.getParentFile();
                                pageName = dir.getName();
                                pageFile = new files.File(dir, pageName + ".html");
                            }
                            else if (strings.endsWith(filename, "-package.json")) {
                                pageName = filename.substring(0, filename.length - "-package.json".length);
                                pageFile = new files.File(file.getParentFile(), pageName + ".html");
                            }
                
                            if (pageName) {
                                var pageDef = new PageDef();
                                pageDef.name = pageName;
                                
                                if (pageFile.exists()) {
                                    pageDef.htmlPath = pageFile.getAbsolutePath();
                                }
                                pageDef.basePath = searchPathEntry.path;
                                pageDef.packagePath = file.getAbsolutePath();
                                config.addPage(pageDef);
                            }
                            
                            
                            
                        }
                    },
                    this);
            }
        }, this);
    }
};
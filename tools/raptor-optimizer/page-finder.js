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
                                pageFileDir;
                            
                            if (filename === 'package.json') {
                                
                                pageFileDir = file.getParentFile();
                                pageName = dir.getName();
                                
                            }
                            else if (strings.endsWith(filename, "-package.json")) {
                                pageFileDir = file.getParentFile();
                                pageName = filename.substring(0, filename.length - "-package.json".length);
                            }

                            if (pageName) {
                                raptor.forEach(config.pageFileExtensions, function(ext) {
                                    var possiblePageFile = new files.File(pageFileDir, pageName + "." + ext);
                                    if (possiblePageFile.exists()) {
                                        pageFile = possiblePageFile;
                                        return false;
                                    }
                                    return true;
                                });
                                
                                var pageDef = new PageDef();
                                pageDef.name = pageName;
                                
                                if (pageFile) {
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
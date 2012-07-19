raptor.defineClass(
    'optimizer.PageFileFinder',
    function(raptor) {
        var PageDef = raptor.require('optimizer.PageDef'),
            packager = raptor.require('packager'),
            strings = raptor.require('strings'),
            files = raptor.require('files'),
            File = files.File;
        
        var PageFileFinder = function() {
            
        };
        
        PageFileFinder.prototype = {
            findPages: function(rootDir, config) {
                raptor.require('files.walker').walk(
                    rootDir, 
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
                                    var possiblePageFile = new File(pageFileDir, pageName + "." + ext);
                                    if (possiblePageFile.exists()) {
                                        pageFile = possiblePageFile;
                                        return false;
                                    }
                                    return true;
                                });
                                
                                var pageDef = new PageDef();
                                pageDef.basePath = rootDir;
                                pageDef.name = pageFileDir.getAbsolutePath().substring(pageDef.basePath.length) + '/' + pageName;
                                
                                if (pageFile) {
                                    pageDef.htmlPath = pageFile.getAbsolutePath();
                                }
                                
                                pageDef.packagePath = file.getAbsolutePath();
                                config.addPage(pageDef);
                            }
                            
                            
                            
                        }
                    },
                    this);
            }
        };
        
        return PageFileFinder;
    });
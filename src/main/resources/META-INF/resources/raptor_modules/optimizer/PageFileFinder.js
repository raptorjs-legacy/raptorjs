raptor.defineClass(
    'optimizer.PageFileFinder',
    function(raptor) {
        var strings = raptor.require('strings'),
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
                            viewFile,
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
                                raptor.forEach(config.getPageViewFileExtensions(), function(ext) {
                                    var possiblePageViewFile = new File(pageFileDir, pageName + "." + ext);
                                    if (possiblePageViewFile.exists()) {
                                        viewFile = possiblePageViewFile;
                                        return false;
                                    }
                                    return true;
                                });
                                
                                pageName = pageFileDir.getAbsolutePath().substring(rootDir.length) + '/' + pageName;
                                
                                config.addPage({
                                    basePath: rootDir,
                                    dir: file.getParentFile(),
                                    name: pageName,
                                    packagePath: file.getAbsolutePath(),
                                    viewFile: viewFile
                                });
                            }
                            
                            
                            
                        }
                    },
                    this);
            }
        };
        
        return PageFileFinder;
    });
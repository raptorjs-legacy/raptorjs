raptor.defineClass(
    'optimizer.PageFileFinder',
    function(raptor) {
        "use strict";
        
        var strings = raptor.require('strings'),
            files = raptor.require('files'),
            File = files.File;
        
        var PageFileFinder = function() {
            
        };
        
        PageFileFinder.prototype = {
            findPages: function(rootDir, basePath, recursive, config) {
                
                
                raptor.require('files.walker').walk(
                    rootDir, 
                    function(file) {
                        if (file.isFile()) {
                            
                            var pageName,
                                filename = file.getName(),
                                filenameNoExt,
                                pageFileDir,
                                packageFile;
                            
                            
                            var lastDot = filename.lastIndexOf('.');
                            if (lastDot != -1) {
                                var extension = filename.substring(lastDot+1);
                                if (config.isPageViewFileExtension(extension)) {
                                    pageFileDir = file.getParentFile();
                                    filenameNoExt = filename.substring(0, lastDot);
                                    pageName = pageFileDir.getAbsolutePath().substring(rootDir.length) + '/' + filenameNoExt;
                                    packageFile = new File(pageFileDir, filenameNoExt + "-package.json");
                                    if (!packageFile.exists()) {
                                        packageFile = new File(pageFileDir, pageFileDir.getName() + "-package.json");
                                        if (!packageFile.exists()) {
                                            packageFile = new File(pageFileDir, "package.json");
                                            if (!packageFile.exists()) {
                                                packageFile = null;
                                            }
                                        }            
                                    }
                                    
                                    if (!packageFile) {
                                        this.logger().warn('Package file not found for page "' + file + '". Skipping...');
                                    }
                                    else {
                                        config.registerPage({
                                            basePath: basePath || rootDir,
                                            dir: file.getParentFile(),
                                            name: pageName,
                                            packageFile: packageFile,
                                            viewFile: file
                                        });
                                    }
                                    
                                }
                            }
                        }
                    },
                    this,
                    {
                        recursive: recursive !== false
                    });
            }
        };
        
        return PageFileFinder;
    });
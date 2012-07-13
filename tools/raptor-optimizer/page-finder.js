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
                                filename = file.getName();
                            
                            if (filename === 'package.json') {
                                pageName = file.getParentFile().getName();
                                pageFile = new files.File(file, pageName).getAbsolutePath();
                            }
                            else if (strings.endsWith(filename, "-package.json")) {
                                pageName = filename.substring(0, filename.length - "-package.json".length);
                                pageFile = new files.File(file.getParentFile(), pageName + ".html");
                            }
                
                            if (pageName) {
                                
                                var pageDef = new PageDef();
                                pageDef.name = pageName;
                                if (pageFile.exists()) {
                                    pageDef.path = pageFile.getAbsolutePath();
                                }

                                var fileResource = raptor.require("resources").createFileResource(file.getAbsolutePath());
                                var manifest = packager.getPackageManifest(fileResource);
                                
                                manifest.forEachInclude(
                                    function(type, pageInclude) {
                                        pageDef.addInclude(pageInclude);
                                    },
                                    this,
                                    {
                                        enabledExtensions: config.getEnabledExtensions()
                                    });
                                config.addPage(pageDef);
                            }
                            
                            
                            
                        }
                    },
                    this);
            }
        }, this);
    }
};
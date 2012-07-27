raptor.defineClass(
    "optimizer.ConfigXmlParser",
    function(raptor) {
        
        var BundleDef = raptor.require('optimizer.BundleDef'),
            BundleSetDef = raptor.require('optimizer.BundleSetDef'),
            PageConfig = raptor.require('optimizer.PageConfig'),
            strings = raptor.require('strings'),
            files = raptor.require('files'),
            File = files.File,
            includeHandler = {
                _type: "object",
                _begin: function(parent, context) {
                    var include = { 
                            type: context.el.getLocalName(),
                            toString: function() { 
                                return JSON.stringify(this);
                            }
                        };
                    parent.addInclude(include);
                    return include;
                },
                
                "@*": {
                    _type: "string",
                    _set: function(include, name, value) {
                        if (value === 'true') {
                            value = true;
                        }
                        else if (value === 'false') {
                            value = false;
                        }
                        else if ("" + parseInt(value, 10) === value) {
                             value = parseInt(value, 10);
                        }
                        include[name] = value;
                    }
                } //End include attribute
            };
        
        var ConfigXmlParser = function() {
            
        };
        
        ConfigXmlParser.prototype = {
            
            parse: function(xml, configFilePath, config) {
                var configDir = new File(configFilePath).getParent();
                
                var resolvePath = function(path) {
                    if (!path) {
                        return path;
                    }
                    
                    return files.resolvePath(configDir, path);
                };
                
                var objectMapper = raptor.require('xml.sax.object-mapper'),
                    reader,
                    bundlesHandler = {
                        _type: "object",
                        _begin: function() {
                            var bundleSetDef = new BundleSetDef();
                            return bundleSetDef;
                        },
                        _end: function(bundleSetDef, parent) {
                            parent.addBundleSetDef(bundleSetDef);
                        },
                        "@name": {},
                        "@ref": {
                            _targetProp: "bundlesRef"
                        },
                        "<bundles>": {
                            _begin: function(bundleSetDef) {
                                return {};
                                
                            },
                            _end: function(child) {
                                if (!child.ref) {
                                    raptor.throwError(new Error('The "ref" attribute is required for nested <bundles> element'));
                                }
                                bundleSetDef.addChild(child);
                            },
                            "@ref": {
                                _required: true,
                                _targetProp: "bundlesRef"
                            }
                        },
                        "<bundle>": {
                            _type: "object",
                            _begin: function(bundleSetDef) {
                                var bundle = new BundleDef();
                                bundleSetDef.addChild(bundle);
                                return bundle;
                            },
                            
                            "@name": {
                                _type: "string"
                            },
                            
                            "<*>": includeHandler
                        } //End "bundle"
                    },
                    optimizerConfigHandler = {
                        _type: "object",
                        
                        _begin: function(parent, tagName) {
                            return config;
                        },
                        "<params>": {
                            "<*>": {
                                _type: "string",
                                _set: function(params, name, value) {
                                    config.addParam(name, value);
                                }
                            }
                        },
                        
                        "resource-search-path": {
                            "<dir>": {
                                _type: "object",
                                _begin: function() {
                                    return {};
                                },
                                _end: function(entry) {
                                    var dirPath = entry.path;
                                    if (!dirPath) {
                                        raptor.throwError(new Error('"path" is required for directory resource search path entry'));
                                    }
                                    dirPath = resolvePath(dirPath);
                                    raptor.require('resources').getSearchPath().addDir(dirPath);
                                },
                                "@path": {
                                    _type: "string"
                                }
                            }
                        },

                        "page-search-path": {
                            "<dir>": {
                                _type: "object",
                                _begin: function() {
                                    return {};
                                },
                                _end: function(entry) {
                                    var dirPath = entry.path;
                                    if (!dirPath) {
                                        raptor.throwError(new Error('"path" is required for directory page search path entry'));
                                    }
                                    dirPath = resolvePath(dirPath);
                                    config.addPageSearchDir(dirPath);
                                },
                                "@path": {
                                    _type: "string"
                                }
                            }
                        },
                        "watch-files-enabled": {
                            _type: "boolean",
                            _targetProp: "watchFilesEnabled"
                        },
                        "watch-pages-enabled": {
                            _type: "boolean",
                            _targetProp: "watchPagesEnabled"
                        },
                        "watch-includes-enabled": {
                            _type: "boolean",
                            _targetProp: "watchIncludesEnabled"
                        }, 
                        
                        "watch-config-enabled": {
                            _type: "boolean",
                            _targetProp: "watchConfigEnabled"
                        }, 
                        
                        "watch-packages-enabled": {
                            _type: "boolean",
                            _targetProp: "watchPackagesEnabled"
                        }, 
                        
                        "checksums-enabled": {
                            _type: "boolean",
                            _targetProp: "checksumsEnabled"
                        },
                        
                        "bundling-enabled": {
                            _type: "boolean",
                            _targetProp: "bundlingEnabled"
                        },
                        
                        "in-place-deployment-enabled": {
                            _type: "boolean",
                            _targetProp: "inPlaceDeploymentEnabled"
                        },
                        
                        "<in-place-deployment>": {
                            _type: "object",
                            "enabled": {
                                _type: "boolean",
                                _targetProp: "inPlaceDeploymentEnabled",
                                _set: function(parent, name, value) {
                                    config[name] = value;
                                }
                            },
                            "<source-mapping>": {
                                _type: "object",
                                _end: function(mapping) {
                                    config.addServerSourceMapping(resolvePath(mapping["base-dir"]), mapping["base-url"]);
                                },
                                "base-dir": {
                                    type: "string"
                                },
                                "base-url": {
                                    type: "string"
                                }
                            }
                        },
                        
                        "clean-output-dirs": {
                            _type: "boolean",
                            _targetProp: "cleanOutputDirs"
                        },
                        "<clean-dirs>": {
                            "<dir>": {
                                _type: "object",
                                _begin: function() {
                                    return {};
                                },
                                _end: function(entry) {
                                    var dirPath = entry.path;
                                    if (!dirPath) {
                                        raptor.throwError(new Error('"path" is required for directory page search path entry'));
                                    }
                                    dirPath = resolvePath(dirPath);
                                    config.addCleanDir(dirPath);
                                },
                                "@path": {
                                    _type: "string"
                                }
                            }
                        },
                        "minify-js": {
                            _type: "boolean",
                            _targetProp: "minifyJs"
                        },
                        "minify-css": {
                            _type: "boolean",
                            _targetProp: "minifyCss"
                        },
                        "output-dir": {
                            _type: "string",
                            _targetProp: "outputDir"
                        },
                        "bundles-output-dir": {
                            _type: "string",
                            _targetProp: "bundlesOutputDir"
                        },
                        "js-output-dir": {
                            _type: "string",
                            _targetProp: "scriptsOutputDir"
                        },
                        "css-output-dir": {
                            _type: "string",
                            _targetProp: "styleSheetsOutputDir"
                        },
                        "html-output-dir": {
                            _type: "string",
                            _targetProp: "htmlOutputDir"
                        },
                        
                        "inject-html-includes": {
                            _type: "object",
                            _begin: function() {
                                return config;
                            },
                            "enabled": {
                                _type: "boolean",
                                _targetProp: "injectHtmlIncludesEnabled"    
                            },
                            "keep-html-markers": {
                                _type: "boolean",
                                _targetProp: "keepHtmlMarkers"
                            },
                            "page-output-dir": {
                                _type: "string",
                                _targetProp: "pageOutputDir"
                            },
                            "modify-pages": {
                                _type: "boolean",
                                _targetProp: "modifyPages"
                            }
                        },
                        
                        "resource-url-prefix": {
                            _type: "string",
                            _targetProp: "resourceUrlPrefix"
                        },
                        "js-url-prefix": {
                            _type: "string",
                            _targetProp: "scriptsUrlPrefix"
                        },
                        "css-url-prefix": {
                            _type: "string",
                            _targetProp: "styleSheetsUrlPrefix"
                        },
                        "enabled-extensions": {
                            _type: "string",
                            _set: function(config, name, value) {
                                var parts = value.split(/\s*,\s*/);
                                parts.forEach(function(extension) {
                                    config.enableExtension(extension);
                                });
                            }
                        },
                        
                        "<output-dir>": {
                            _type: "string"
                        },
                        "<bundles>": bundlesHandler, //End "bundles"
                        
                        "raptor-config": {
                            _type: "string",
                            _set: function(config, name, value) {
                                config.raptorConfigJSON = JSON.stringify(eval('(' + value + ')'));
                            }
                        },
                        "<pages>": {
                            "<page>": {
                                _type: "object",
                                _begin: function() {
                                    var pageConfig = new PageConfig();
                                    return pageConfig;
                                },
                                
                                _end: function(pageConfig) {
                                    var htmlPath = pageConfig.htmlPath;
                                    if (!htmlPath) {
                                        raptor.throwError('The "htmlPath" property is required for a page config');
                                    }
                                    pageConfig.htmlPath = htmlPath = resolvePath(htmlPath);
                                    pageConfig.packagePath = resolvePath(pageConfig.packagePath);
                                    config.addPage({
                                        
                                    })
                                    
                                },
                                
                                "htmlPath": {
                                    _type: "string"
                                },
                                
                                "@name": {
                                },
                                
                                "<bundles>": bundlesHandler,
                                
                                "<includes>": {
                                    "<*>": includeHandler
                                }
                            } //End <page>
                        } //End "<pages>"
                       
                    }; //End "optimizer-config" 
                
                reader = objectMapper.createReader(
                    {
                        "<optimizer-config>": raptor.extend(optimizerConfigHandler, {
                            "set-profile": {
                                _type: "string",
                                _targetProp: "profileName"
                            },
                            
                            "<profile>": raptor.extend(optimizerConfigHandler, {
                                _type: "object",
                                _begin: function() {
                                    return config;
                                },
                                "@name": {
                                    _type: "string",
                                    _set: function(parent, name, value) {
                                        if (value !== config.profileName) {
                                            reader.skipCurrentElement();    
                                        }
                                    }
                                },
                                "@enabled": {
                                    _type: "boolean",
                                    _set: function(parent, name, value) {
                                        if (value !== true) {
                                            reader.skipCurrentElement();    
                                        }
                                    }
                                }
                            })
                        })
                    },
                    { //objectMapper options
                        parseProp: function(value, name) {
                            var result = strings.merge(value, config.params);
                            return result;
                        }
                    });
                
                reader.read(
                    xml,
                    configFilePath);
                
                
                
                
                ["bundlesOutputDir",
                 "scriptsOutputDir",
                 "styleSheetsOutputDir",
                 "bundlesOutputDir",
                 "pageOutputDir",
                 "htmlOutputDir"].forEach(function(dir) {
                     if (config[dir]) {
                         config[dir] = resolvePath(config[dir]);
                     }
                 });  
                
            }
        };
        
        return ConfigXmlParser;
    });
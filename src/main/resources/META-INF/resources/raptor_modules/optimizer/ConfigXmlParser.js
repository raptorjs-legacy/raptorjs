raptor.defineClass(
    "optimizer.ConfigXmlParser",
    function(raptor) {
        "use strict";
        
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
                    echoHandler = {
                        _type: "object",
                        _begin: function() {
                            return {};
                        },
                        _end: function(echo) {
                            console.log(echo.message);
                        },
                        "@message": {
                            _type: "string"
                        }
                    },
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
                            _end: function(child, bundleSetDef) {
                                if (!child.ref) {
                                    throw raptor.createError(new Error('The "ref" attribute is required for nested <bundles> element'));
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
                        
                        "<echo>": echoHandler,
                        
                        "<params>": {
                            "@file": {
                                _set: function(parent, name, value) {
                                    var path = resolvePath(value);
                                    
                                    if (raptor.require('files').exists(path)) {
                                        var json = raptor.require('files').readAsString(path, "UTF-8");
                                        raptor.forEachEntry(JSON.parse(json), function(paramName, paramValue) {
                                            config.addParam(paramName, paramValue);
                                        });    
                                    }
                                }
                            },
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
                                        throw raptor.createError(new Error('"path" is required for directory resource search path entry'));
                                    }
                                    dirPath = resolvePath(dirPath);
                                    if (!raptor.require('resources').getSearchPath().hasDir(dirPath)) {
                                        raptor.require('resources').getSearchPath().addDir(dirPath);    
                                    }
                                },
                                "@path": {
                                    _type: "string"
                                }
                            }
                        },

                        "page-search-path": {
                            "@reset": {
                                _type: "boolean",
                                _set: function(parent, name, value) {
                                    config.clearPageSearchPath();
                                }
                            },
                            "<dir>": {
                                _type: "object",
                                _begin: function() {
                                    return {};
                                },
                                _end: function(entry) {
                                    var dirPath = entry.path;
                                    if (!dirPath) {
                                        throw raptor.createError(new Error('"path" is required for directory page search path entry'));
                                    }
                                    dirPath = resolvePath(dirPath);
                                    config.addPageSearchDir(dirPath, entry.basePath, entry.recursive !== false);
                                },
                                "@path": {
                                    _type: "string"
                                },
                                "@base-path": {
                                    _type: "string",
                                    _set: function(parent, name, value) {
                                        
                                        parent.basePath = resolvePath(value);
                                    }
                                },
                                "@recursive": {
                                    _type: "boolean"
                                }
                            }
                        },
                        "watch-files-enabled": {
                            _type: "boolean"
                        },
                        "watch-pages-enabled": {
                            _type: "boolean"
                        },
                        "watch-includes-enabled": {
                            _type: "boolean"
                        }, 
                        
                        "watch-config-enabled": {
                            _type: "boolean"
                        }, 
                        
                        "watch-packages-enabled": {
                            _type: "boolean"
                        }, 
                        
                        "watch": {
                            _type: "object",
                            _begin: function() {
                                return [];
                            },
                            _end: function(watchConfigs) {
                                config.addWatchConfigs(watchConfigs);
                            },
                            "<dir>": {
                                _type: "object",
                                _begin: function() {
                                    return {
                                        type: "dir"
                                    };
                                },
                                _end: function(watchConfig, watchConfigs) {
                                    watchConfigs.push(watchConfig);
                                },
                                "path": {
                                    _type: "string"
                                },
                                "recursive": {
                                    _type: "boolean"
                                },
                                "filenamePatterns": {
                                    _type: "string"
                                }
                            }
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
                                        throw raptor.createError(new Error('"path" is required for directory page search path entry'));
                                    }
                                    dirPath = resolvePath(dirPath);
                                    config.addCleanDir(dirPath);
                                },
                                "@path": {
                                    _type: "string"
                                }
                            }
                        },
                        
                        "<filter>": {
                            _type: "object",
                            _begin: function() {
                                return {};
                            },
                            _end: function(filter) {
                                if (!filter.className) {
                                    throw raptor.createError(new Error('The "class-name" attribute is required for a filter.'));
                                }
                                config.addFilter(filter);
                            },
                            "class-name": {
                                _type: "string"
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
                        "resolve-css-urls": {
                            _type: "boolean",
                            _targetProp: "resolveCssUrls"
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
                            _targetProp: "cssOutputDir"
                        },
                        
                        "<write-rendered-pages>": {
                            _type: "object",
                            _begin: function() {
                                return {};
                            },
                            _end: function(writeRenderedPages) {
                                if (writeRenderedPages.enabled !== false) {
                                    config.setWriteRenderedPagesEnabled(true);
                                    config.setRenderedPagesOutputDir(resolvePath(writeRenderedPages.outputDir));
                                }
                            },
                            
                            "enabled": {
                                _type: "boolean"
                            },
                            "output-dir": {
                                _type: "string"
                            }
                        },
                        
                        "<write-page-slots-html>": {
                            _type: "object",
                            _begin: function() {
                                return {};
                            },
                            _end: function(writePageSlotsHtml) {
                                if (writePageSlotsHtml.enabled !== false) {
                                    config.setWritePageSlotsHtmlEnabled(true);
                                    config.setPageSlotsHtmlOutputDir(resolvePath(writePageSlotsHtml.outputDir));
                                }
                            },
                            
                            "enabled": {
                                _type: "boolean"
                            },
                            "output-dir": {
                                _type: "string"
                            }
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

                            "modify-pages": {
                                _type: "boolean",
                                _targetProp: "modifyPages"
                            },
                            
                            "page-output-dir": {
                                _type: "string",
                                _targetProp: "renderedPagesOutputDir"
                            }
                        },
                        
                        "resource-url-prefix": {
                            _type: "string",
                            _targetProp: "resourceUrlPrefix"
                        },
                        "js-url-prefix": {
                            _type: "string"
                        },
                        "css-url-prefix": {
                            _type: "string"
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
                                    
                                    if (pageConfig.htmlPath) {
                                        pageConfig.htmlPath = resolvePath(pageConfig.htmlPath);    
                                    }
                                    
                                    if (pageConfig.packagePath) {
                                        pageConfig.packageFile = new File(resolvePath(pageConfig.packagePath));    
                                    }
                                    
                                    config.registerPage(pageConfig);
                                    
                                },
                                
                                "html-path": {
                                    _type: "string",
                                    _targetProp: "htmlPath"
                                },
                                
                                "@name": {
                                },
                                
                                "<bundles>": bundlesHandler,
                                
                                "<includes>": {
                                    _type: "object",
                                    _begin: function(page) {
                                        return page; //Use the page as the parent for the includes
                                    },
                                    
                                    "<*>": includeHandler
                                }
                            } //End <page>
                        } //End "<pages>"
                       
                    }; //End "optimizer-config" 
                
                var nestedProfileConfigHandler = raptor.extend(optimizerConfigHandler, {
                    _type: "object",
                    _begin: function() {
                        return config;
                    },
                    "@name": {
                        _type: "string",
                        _set: function(parent, name, value) {
                            if (!config.isProfileEnabled(value)) {
                                reader.skipCurrentElement();    
                            }
                        }
                    },
                    "@enabled": {
                        _type: "string",
                        _set: function(parent, name, value) {
                            
                            if (!value || value === 'false') {
                                reader.skipCurrentElement();    
                            }
                        }
                    },
                    
                    "<echo>": echoHandler
                });
                
                nestedProfileConfigHandler["<profile>"] = nestedProfileConfigHandler;
                
                reader = objectMapper.createReader(
                    {
                        "<optimizer-config>": raptor.extend(optimizerConfigHandler, {
                            "set-profile": {
                                _type: "string",
                                _set: function(parent, name, value) {
                                    parent.setProfile(value);
                                }
                            },
                            
                            "enable-profile": {
                                _type: "string",
                                _set: function(parent, name, value) {
                                    parent.enableProfile(value);
                                }
                            },
                            
                            "enable-profiles": {
                                _type: "string",
                                _set: function(parent, name, value) {
                                    parent.enableProfiles(value);
                                }
                            },
                            
                            "<profile>": nestedProfileConfigHandler
                        })
                    },
                    { //objectMapper options
                        parseProp: function(value, context) {
                            var result = strings.merge(value, config.params);
                            return result;
                        },
                        
                        defaultTargetProp: function(context) {
                            var targetProp = context.localName.replace(/[\-][a-z]/g, function(match) {
                                return match.substring(1).toUpperCase();
                            }); 
                            return targetProp;
                        }
                    });
                
                reader.read(
                    xml,
                    configFilePath);
                
                
                
                
                ["bundlesOutputDir",
                 "scriptsOutputDir",
                 "cssOutputDir",
                 "bundlesOutputDir",
                 "renderedPagesOutputDir"].forEach(function(dir) {
                     if (config[dir]) {
                         config[dir] = resolvePath(config[dir]);
                     }
                 });  
                
            }
        };
        
        return ConfigXmlParser;
    });
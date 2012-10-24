raptor.defineClass(
    "optimizer.ConfigXmlParser",
    function(raptor) {
        "use strict";
        
        var BundleConfig = raptor.require('optimizer.BundleConfig'),
            BundleSetConfig = raptor.require('optimizer.BundleSetConfig'),
            PageConfig = raptor.require('optimizer.PageConfig'),
            strings = raptor.require('strings'),
            files = raptor.require('files'),
            File = files.File,
            dependencyHandler = {
                _type: "object",
                _begin: function(parent, context) {
                    var dependency = { 
                            type: context.el.getLocalName(),
                            toString: function() { 
                                return JSON.stringify(this);
                            }
                        };
                    parent.addDependency(dependency);
                    return dependency;
                },
                
                "@*": {
                    _type: "string",
                    _set: function(dependency, name, value) {
                        if (value === 'true') {
                            value = true;
                        }
                        else if (value === 'false') {
                            value = false;
                        }
                        else if ("" + parseInt(value, 10) === value) {
                             value = parseInt(value, 10);
                        }
                        dependency[name] = value;
                    }
                } //End dependency attribute
            };
        
        var ConfigXmlParser = function() {
            
        };
        
        ConfigXmlParser.prototype = {
            
            parse: function(xml, configFilePath, config) {
                var configDir = new File(configFilePath).getParent(),
                    outputDir = null;
                
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
                            var bundleSetConfig = new BundleSetConfig(config);
                            return bundleSetConfig;
                        },
                        _end: function(bundleSetConfig, parent) {
                            parent.addBundleSetConfig(bundleSetConfig);
                        },
                        "@name": {
                            _type: "string",
                            _targetProp: "name"
                        },
                        "@ref": {
                            _type: "string",
                            _targetProp: "ref"
                        },
                        "<bundles>": {
                            _begin: function(bundleSetConfig) {
                                return {};
                                
                            },
                            _end: function(child, bundleSetConfig) {
                                if (!child.ref) {
                                    throw raptor.createError(new Error('The "ref" attribute is required for nested <bundles> element'));
                                }
                                bundleSetConfig.addChild(child);
                            },
                            "@ref": {
                                _required: true,
                                _targetProp: "bundlesRef"
                            },
                            
                            "@enabled": {
                                _type: "boolean"
                            }
                        },
                        "<bundle>": {
                            _type: "object",
                            _begin: function(bundleSetConfig) {
                                var bundle = new BundleConfig();
                                bundleSetConfig.addChild(bundle);
                                return bundle;
                            },
                            
                            "@name": {
                                _type: "string"
                            },
                            
                            "@enabled": {
                                _type: "boolean"
                            },
                            
                            "<*>": dependencyHandler
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
                            _targetProp: "outputDir",
                            _set: function(config, name, value) {
                                
                                outputDir = value;
                                
                                config.outputDir = resolvePath(value);
                            }
                        },
                        
                        "url-prefix": {
                            _type: "string",
                            _targetProp: "urlPrefix"
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
                                    return new PageConfig();
                                },
                                
                                _end: function(pageConfig) {
                                    if (!pageConfig.name) {
                                        throw raptor.createError(new Error('The "name" attribute is required for page definitions'));
                                    }
                                    if (this.bundleSetConfig) {
                                        if (!this.bundleSetConfig.name && !this.bundleSetConfig.ref) {
                                            this.bundleSetConfig.name = pageConfig.name;
                                        }
                                    }
                                    config.registerPageConfig(pageConfig);
                                },

                                "@name": {
                                },
                                
                                "<bundles>": bundlesHandler
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
                
                if (!config.outputDir) {
                    config.outputDir = resolvePath("static");
                }
            }
        };
        
        return ConfigXmlParser;
    });
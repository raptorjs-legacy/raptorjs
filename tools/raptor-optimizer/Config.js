var BundleDef = require('./BundleDef.js'),
    BundleSetDef = require('./BundleSetDef.js'),
    PageDef = require('./PageDef.js'),
    optimizer = raptor.require('optimizer'),
    strings = raptor.require('strings'),
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
    

    
var Config = function() {
    this.bundlingEnabled = true;
    this.bundlesOutputDir = "dist/static/bundles";
    this.scriptsOutputDir = null;
    this.styleSheetsOutputDir = null;
    this.checksumsEnabled = true;
    this.htmlOutputDir = "dist/inc/page-dependencies";
    this.pageOutputDir = "dist/pages";
    this.scriptsUrlPrefix = null;
    this.styleSheetsUrlPrefix = null;
    this.urlPrefix = null;
    this.modifyPages = false;
    this.enabledExtensions = {};
    this.params = {};
    this.pages = [];
    this.bundleSetDefsByName = {};
    this.loadedBundleSets = {};
    this.pageSearchPath = [];
    this.keepHtmlMarkers = true;
    this.cleanOutputDirs = false;
    this.cleanDirs = [];
    this.watchFilesEnabled = false;
    this.watchPagesEnabled = false;
    this.watchIncludesEnabled = false;
    this.watchConfigEnabled = false;
    this.watchPackagesEnabled = false;
};

Config.parseIncludes = function(xml, path, config) {
    var objectMapper = raptor.require('xml.sax.objectMapper');
    var includes = objectMapper.read(
        xml,
        path,
        {
            "<includes>": {
                _type: "object",
                
                _begin: function() {
                    return [];
                },
                "<includes>": includeHandler
            }
        },
        { //objectMapper options
            parseProp: function(value, name) {
                var result = strings.merge(value, config.params);
                return result;
            }
        });
    return includes;
};

Config.prototype = {
    isWatchPagesEnabled: function() {
        return this.watchPagesEnabled || this.watchFilesEnabled;
    },
    
    isWatchIncludesEnabled: function() {
        return this.watchIncludesEnabled || this.watchFilesEnabled;
    },
    
    isWatchConfigEnabled: function() {
        return this.watchConfigEnabled || this.watchFilesEnabled;
    },
    
    isWatchPackagesEnabled: function() {
        return this.watchPackagesEnabled || this.watchFilesEnabled;
    },
    
    addCleanDir: function(path) {
        this.cleanDirs.push(path);
    },
    
    addParam: function(name, value) {
        if (this.params.hasOwnProperty(name)) {
            return; //Params are only write-once
        }
        this.params[name] = value;
    },
    
    addPageSearchDir: function(path) {
        this.pageSearchPath.push({type: "dir", path: path});
    },
    
    hasPageSearchPath: function() {
        return this.pageSearchPath.length > 0;
    },
    
    forEachPageSearchPathEntry: function(callback, thisObj) {
        raptor.forEach(this.pageSearchPath, callback, thisObj);
    },
    
    getScriptsOutputDir: function() {
        return this.scriptsOutputDir || this.bundlesOutputDir || this.outputDir;
    },
    
    getStyleSheetsOutputDir: function() {
        return this.styleSheetsOutputDir || this.bundlesOutputDir || this.outputDir;
    },
    
    getHtmlOutputDir: function() {
        return this.htmlOutputDir || this.outputDir;
    },
    
    addBundleSetDef: function(bundleSetDef) {
        if (!bundleSetDef.name) {
            bundleSetDef.name = "default";
        }
        
        if (this.bundleSetDefsByName[bundleSetDef.name]) {
            raptor.throwError(new Error('Bundles with name "' + bundleSetDef.name + '" defined multiple times'));
        }
        
        this.bundleSetDefsByName[bundleSetDef.name] = bundleSetDef;
    },
    
    getBundleSetDef: function(name) {
        return this.bundleSetDefsByName[name];
    },

    enableExtension: function(name) {
        this.enabledExtensions[name] = true;
    },
    
    getEnabledExtensions: function() {
        return Object.keys(this.enabledExtensions);
    },
    
    addPage: function(page) {
        page.config = this;
        this.pages.push(page);
    },
    
    forEachPage: function(callback, thisObj) {
        raptor.forEach(this.pages, callback, thisObj);
    },
    
    createBundleSet: function(bundleSetDef, enabledExtensions) {
        
        var config = this,
            bundles = [],
            foundBundleToIndex = {},
            addBundles = function(o) {
                if (o.bundlesRef) {
                    var referencedBundleSetDef = config.getBundleSetDef(o.bundlesRef);
                    if (!referencedBundleSetDef) {
                        raptor.throwError(new Error('Bundles not found with name "' + o.bundlesRef + '"'));
                    }
                    addBundles(referencedBundleSetDef);
                    return;
                }
                else if (o instanceof BundleDef) {
                    var bundleName = o.name;
                    
                    if (!bundleName) {
                        raptor.throwError(new Error("Illegal state. Bundle name is required"));
                    }
                    if (config.checksumsEnabled === false) {
                        bundleName = bundleSetDef.name + "-" + bundleName; //Prefix the bundle name with the bundle set name to keep the bundle names unique
                    }
                    
                    var bundle = optimizer.createBundle(bundleName);
                    o.forEachInclude(function(include) {
                        bundle.addInclude(include);
                    });
                    
                    if (foundBundleToIndex[bundleName]) {
                        foundBundleToIndex[bundleName] = bundle; 
                    }
                    else {
                        foundBundleToIndex[bundleName] = bundles.length;
                        bundles.push(bundle);
                    }
                }
                else if (o instanceof BundleSetDef) {
                    o.forEachChild(addBundles);
                }
            };
            
        if (this.bundlingEnabled !== false) {
            addBundles(bundleSetDef);    
        };
        
        var bundleSet = optimizer.createBundleSet(
                bundles,
                {
                    enabledExtensions: enabledExtensions
                });
        
        return bundleSet;
    },
    
    toString: function() {
        return "[Config]";
    },
    
    parseXml: function(xml, path) {
        var config = this,
            objectMapper = raptor.require('xml.sax.objectMapper'),
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
                            dirPath = require('path').resolve(process.cwd(), dirPath);
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
                            dirPath = require('path').resolve(process.cwd(), dirPath);
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
                            dirPath = require('path').resolve(process.cwd(), dirPath);
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
                "page-output-dir": {
                    _type: "string",
                    _targetProp: "pageOutputDir"
                },
                "modify-pages": {
                    _type: "boolean",
                    _targetProp: "modifyPages"
                },
                "inject-html-includes": {
                    _type: "boolean",
                    _targetProp: "injectHtmlIncludes"
                },
                "keep-html-markers": {
                    _type: "boolean",
                    _targetProp: "keepHtmlMarkers"
                },
                "url-prefix": {
                    _type: "string",
                    _targetProp: "urlPrefix"
                },
                "js-url-prefix": {
                    _type: "string",
                    _targetProp: "scriptsUrlPrefix"
                },
                "css-url-prefix": {
                    _type: "string",
                    _targetProp: "styleSheetsUrlPrefix"
                },
                "enabledExtensions": {
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
                            var page = new PageDef();
                            config.addPage(page);
                            return page;
                        },
                        
                        "path": {
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
            path);
    }
};

module.exports = Config;
var BundleDef = require('./BundleDef.js'),
    BundleSetDef = require('./BundleSetDef.js'),
    PageDef = require('./PageDef.js'),
    optimizer = raptor.require('optimizer'),
    strings = raptor.require('strings');
    

    
var Config = function() {
    this.bundlesOutputDir = "dist/static/bundles";
    this.scriptsOutputDir = null;
    this.styleSheetsOutputDir = null;
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
};

Config.prototype = {
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
                    var bundleSetDef = config.getBundleSetDef(o.bundlesRef);
                    if (!bundleSetDef) {
                        raptor.throwError(new Error('Bundles not found with name "' + o.bundlesRef + '"'));
                    }
                    addBundles(bundleSetDef);
                    return;
                }
                else if (o instanceof BundleDef) {
                    if (!o.name) {
                        raptor.throwError(new Error("Illegal state. Bundle name is required"));
                    }
                    var bundle = optimizer.createBundle(o.name);
                    o.forEachInclude(function(include) {
                        bundle.addInclude(include);
                    });
                    
                    if (foundBundleToIndex[o.name]) {
                        foundBundleToIndex[o.name] = bundle; 
                    }
                    else {
                        foundBundleToIndex[o.name] = bundles.length;
                        bundles.push(bundle);
                    }
                }
                else if (o instanceof BundleSetDef) {
                    o.forEachChild(addBundles);
                }
            };
            
        addBundles(bundleSetDef);
        
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
            includeHandler = {
                _type: "object",
                _begin: function(parent, el) {
                    var include = { 
                            type: el.getLocalName(),
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
            };
        
        
        objectMapper.read(
            xml,
            path,
            {
                "<optimizer-config>": {
                    _type: "object",
                    
                    _begin: function() {
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
                                var path = entry.path;
                                if (!entry.path) {
                                    raptor.throwError(new Error('"path" is required for directory resource search path entry'));
                                }
                                path = require('path').resolve(process.cwd(), path);
                                raptor.require('resources').getSearchPath().addDir(path);
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
                            _end: function(entry, config) {
                                var path = entry.path;
                                if (!entry.path) {
                                    raptor.throwError(new Error('"path" is required for directory resource search path entry'));
                                }
                                path = require('path').resolve(process.cwd(), path);
                                config.addPageSearchDir(path);
                            },
                            "@path": {
                                _type: "string"
                            }
                        }
                    },
                    
                    "clean-output-dirs": {
                        _type: "boolean",
                        _targetProp: "cleanOutputDirs"
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
                   
                } //End "bundle-config"
            },
            { //objectMapper options
                parseProp: function(value, name) {
                    var result = strings.merge(value, config.params);
                    return result;
                }
            });
    }
};

module.exports = Config;
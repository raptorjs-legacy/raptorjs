raptor.defineClass(
    "optimizer.Config",
    function(raptor) {
        
        var strings = raptor.require('strings');
        
        var Config = function(params) {
            this.bundlingEnabled = true;
            this.bundlesOutputDir = "dist/static/bundles";
            this.scriptsOutputDir = null;
            this.styleSheetsOutputDir = null;
            this.checksumsEnabled = true;
            this.htmlOutputDir = "dist/inc/page-dependencies";
            this.pageOutputDir = "dist/pages";
            this.scriptsUrlPrefix = null;
            this.styleSheetsUrlPrefix = null;
            this.resourceUrlPrefix = null;
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
            this.pageFileExtensions = ["html"];
            this.inPlaceDeploymentEnabled = false;
            this.serverSourceMappings = [];
            this.injectHtmlIncludesEnabled = false;
            this.pagesByName = {};
            
            if (params) {
                raptor.extend(this.params, params);
            }
        };
        
        Config.prototype = {
            forEachCleanDir: function(callback, thisObj) {
                this.cleanDirs.forEach(callback, thisObj);
            },
            
            findPages: function() {
                var PageFileFinder = raptor.require('optimizer.PageFileFinder');
                var pageFileFinder = new PageFileFinder();
                
                if (this.hasPageSearchPath()) {
                    this.forEachPageSearchPathEntry(function(searchPathEntry) {
                        if (searchPathEntry.type === 'dir') {
                            if (!searchPathEntry.path) {
                                raptor.throwError(new Error("Path missing: " + JSON.stringify(searchPathEntry)));
                            }
                            pageFileFinder.findPages(searchPathEntry.path, this);
                        }
                    }, this);
                }
            },
            
            isChecksumsEnabled: function() {
                return this.checksumsEnabled === true;
            },
            
            isInPlaceDeploymentEnabled: function() {
                return this.inPlaceDeploymentEnabled === true;
            },
            
            isBundlingEnabled: function() {
                return this.bundlingEnabled;
            },
            
            addServerSourceMapping: function(baseDir, baseUrl) {
                this.serverSourceMappings.push({baseDir: baseDir, baseUrl: baseUrl});
            },
            
            hasServerSourceMappings: function() {
                return this.serverSourceMappings.length != 0;
            },
            
            getUrlForSourceFile: function(path) {
                
                var url;
                
                this.serverSourceMappings.forEach(function(mapping) {
                    if (strings.startsWith(path, mapping.baseDir)) {
                        var relativePath = path.substring(mapping.baseDir.length);
                        url = mapping.baseUrl + relativePath;
                        return false;
                    }
                    return true; //Keep going
                });
                
                return url;
            },
            
            setPageFileExtensions: function(extensions) {
                this.pageFileExtensions = extensions || []; 
            },
            
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
            
            getScriptsUrlPrefix: function() {
                return this.scriptsUrlPrefix || this.resourceUrlPrefix;
            },
            
            getStyleSheetsUrlPrefix: function() {
                return this.styleSheetsUrlPrefix || this.resourceUrlPrefix;
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
            
            isInjectHtmlIncludesEnabled: function() {
                return this.injectHtmlIncludesEnabled === true;
            },
            
            isModifyPagesEnabled: function() {
                return this.modifyPages === true;
            },
            
            isKeepHtmlMarkersEnabled: function() {
                return this.keepHtmlMarkers === true;
            },
            
            getPageOutputDir: function() {
                return this.pageOutputDir;
            },
            
            getPageDef: function(pageName) {
                return this.pagesByName[pageName];
            },
            
            addPage: function(page) {
                page.config = this;
                this.pages.push(page);
                this.pagesByName[page.getName()] = page;
            },
            
            forEachPage: function(callback, thisObj) {
                raptor.forEach(this.pages, callback, thisObj);
            },
            
            createBundleSet: function(bundleSetDef, enabledExtensions) {
                var BundleSetDef = raptor.require('optimizer.BundleSetDef'),
                    BundleDef = raptor.require('optimizer.BundleDef');
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
                            
                            var bundle = raptor.require('optimizer').createBundle(bundleName);
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
                
                var bundleSet = raptor.require('optimizer').createBundleSet(
                        bundles,
                        {
                            enabledExtensions: enabledExtensions
                        });
                
                return bundleSet;
            },
                
            
            parseXml: function(xml, configFilePath) {
                var ConfigXmlParser = raptor.require('optimizer.ConfigXmlParser');
                var parser = new ConfigXmlParser();
                parser.parse(xml, configFilePath, this);
            }
        };
        
        return Config;
    });
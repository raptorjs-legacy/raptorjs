raptor.defineClass(
    "optimizer.Config",
    function(raptor) {
        "use strict";
        
        var strings = raptor.require('strings');
        
        var Config = function(params) {
            this.outputDir = "dist";
            this.bundlingEnabled = true;
            this.bundlesOutputDir = null;
            this.scriptsOutputDir = null;
            this.styleSheetsOutputDir = null;
            this.checksumsEnabled = true;
            this.htmlOutputDir = null;
            this.pageOutputDir = null;
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
            this.watchTemplatesEnabled = false;
            this.watchConfigs = [];
            this.inPlaceDeploymentEnabled = false;
            this.serverSourceMappings = [];
            this.injectHtmlIncludesEnabled = false;
            this.pagesByName = {};
            this.pageClassNamesByExt = {
                "html": "optimizer.PageHtml",
                "xhtml": "optimizer.PageHtml",
                "rhtml": "optimizer.PageRhtml"
            };
            
            if (params) {
                raptor.extend(this.params, params);
            }
        };
        
        Config.prototype = {
            forEachCleanDir: function(callback, thisObj) {
                this.cleanDirs.forEach(callback, thisObj);
            },
            
            getPage: function(name) {
                return this.pagesByName[name];
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
                return this.serverSourceMappings.length !== 0;
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
            
            isWatchTemplatesEnabled: function() {
                return this.watchTemplatesEnabled || this.watchFilesEnabled;
            },
            
            addWatchConfigs: function(watchConfigs) {
                if (!watchConfigs || !watchConfigs.length) {
                    return;
                }
                
                this.watchConfigs = this.watchConfigs.concat(watchConfigs);
            },
            
            getWatchConfigs: function() {
                return this.watchConfigs;
            },
            
            addCleanDir: function(path) {
                this.cleanDirs.push(path);
            },
            
            getParam: function(name) {
                return this.params[name];
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
            
            isWriteHtmlIncludesEnabled: function() {
                return this.writeHtmlIncludes = true;
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
            
            getPageViewFileExtensions: function() {
                return Object.keys(this.pageClassNamesByExt);
            },
            
            hasPages: function() {
                return this.pages.length !== 0;
            },
            
            isMinifyJsEnabled: function() {
                return this.minifyJs === true;
            },
            
            addPage: function(pageConfig) {
                var pageClassName,
                    viewFile = pageConfig.viewFile;
                
                if (viewFile) {
                    pageClassName = this.pageClassNamesByExt[viewFile.getExtension()]; 
                }
                
                if (!pageClassName) {
                    pageClassName = "optimizer.PageHtml";
                }
                
                var PageClass = raptor.require(pageClassName);
                var page = new PageClass(pageConfig);
                
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
                }
                
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
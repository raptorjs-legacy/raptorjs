raptor.defineClass(
    "optimizer.Config",
    function(raptor) {
        "use strict";
        
        var strings = raptor.require('strings');
        
        var Config = function(params) {
            this.configResource = null;
            this.outputDir = "dist";
            this.bundlingEnabled = true;
            this.bundlesOutputDir = null;
            this.scriptsOutputDir = null;
            this.cssOutputDir = null;
            this.checksumsEnabled = true;
            this.pageSlotsHtmlOutputDir = null;
            this.renderedPagesOutputDir = null;
            this.scriptsUrlPrefix = null;
            this.cssUrlPrefix = null;
            this.enabledProfiles = {};
            this.resourceUrlPrefix = null;
            this.modifyPages = false;
            this.enabledExtensions = raptor.require('packager').createExtensionCollection();
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
            this.writePageSlotsHtmlEnabled = false;
            this.writeRenderedPagesEnabled = true;
            this.pagesByName = {};
            this.checksumLength = 8;
            this.filters = [];
            
            this.pageClassNamesByExt = {
                "html": "optimizer.PageStatic",
                "xhtml": "optimizer.PageStatic",
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
                                throw raptor.createError(new Error("Path missing: " + JSON.stringify(searchPathEntry)));
                            }

                            pageFileFinder.findPages(searchPathEntry.path, searchPathEntry.basePath, searchPathEntry.recursive !== false, this);
                        }
                    }, this);
                }
            },
            
            addFilter: function(filter) {
                if (typeof filter === 'string') {
                    filter = {
                        className: filter
                    };
                }
                this.filters.push(filter);
            },
            
            getFilters: function() {
                return this.filters;
            },
            
            setOutputDir: function(outputDir) {
                this.outputDir = outputDir;
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
            
            addPageSearchDir: function(path, basePath, recursive) {
                this.pageSearchPath.push({type: "dir", path: path, basePath: basePath, recursive: recursive !== false});
            },
            
            clearPageSearchPath: function() {
                this.pageSearchPath = [];
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
            
            getUrlPrefix: function() {
                return this.cssUrlPrefix || this.resourceUrlPrefix;
            },

            getScriptsOutputDir: function() {
                return this.scriptsOutputDir || this.bundlesOutputDir || this.outputDir;
            },
            
            getCssOutputDir: function() {
                return this.cssOutputDir || this.bundlesOutputDir || this.outputDir;
            },
            
            getHtmlOutputDir: function() {
                return this.pageSlotsHtmlOutputDir || this.outputDir;
            },
            
            setPageSlotsHtmlOutputDir: function(pageSlotsHtmlOutputDir) {
                this.pageSlotsHtmlOutputDir = pageSlotsHtmlOutputDir;
            },
            
            addBundleSetDef: function(bundleSetDef) {
                var BundleSetDef = raptor.require('optimizer.BundleSetDef');
                
                if (!(bundleSetDef instanceof BundleSetDef)) {
                    bundleSetDef = new BundleSetDef(bundleSetDef);
                }
                
                if (!bundleSetDef.name) {
                    bundleSetDef.name = "default";
                }
                
                if (this.bundleSetDefsByName[bundleSetDef.name]) {
                    throw raptor.createError(new Error('Bundles with name "' + bundleSetDef.name + '" defined multiple times'));
                }
                
                this.bundleSetDefsByName[bundleSetDef.name] = bundleSetDef;
                
                return bundleSetDef;
            },
            
            getBundleSetDef: function(name) {
                return this.bundleSetDefsByName[name];
            },

            enableExtension: function(name) {
                
                this.enabledExtensions.add(name);
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            isInjectHtmlIncludesEnabled: function() {
                return this.injectHtmlIncludesEnabled === true;
            },
            
            isWritePageSlotsHtmlEnabled: function(writePageSlotsHtmlEnabled) {
                return this.writePageSlotsHtmlEnabled === true;
            },
            
            setWritePageSlotsHtmlEnabled: function(writePageSlotsHtmlEnabled) {
                this.writePageSlotsHtmlEnabled = writePageSlotsHtmlEnabled;
            },
            
            
            isWriteRenderedPagesEnabled: function(writeRenderedPagesEnabled) {
                return this.writeRenderedPagesEnabled === true;
            },
            
            setWriteRenderedPagesEnabled: function(writeRenderedPagesEnabled) {
                this.writeRenderedPagesEnabled = writeRenderedPagesEnabled;
            },
            
            isModifyPagesEnabled: function() {
                return this.modifyPages === true;
            },
            
            isKeepHtmlMarkersEnabled: function() {
                return this.keepHtmlMarkers === true;
            },
            
            getRenderedPagesOutputDir: function() {
                return this.renderedPagesOutputDir;
            },
            
            setRenderedPagesOutputDir: function(renderedPagesOutputDir) {
                this.renderedPagesOutputDir = renderedPagesOutputDir;
            },
            
            getPageViewFileExtensions: function() {
                return Object.keys(this.pageClassNamesByExt);
            },
            
            isPageViewFileExtension: function(ext) {
                return this.pageClassNamesByExt.hasOwnProperty(ext);
            },
            
            hasPages: function() {
                return this.pages.length !== 0;
            },
            
            isMinifyJsEnabled: function() {
                return this.minifyJs === true;
            },
            
            enableProfile: function(profileName) {
                this.enabledProfiles[profileName] = true;
            },
            
            enableProfiles: function(profileNames) {
                if (typeof profileNames === 'string') {
                    profileNames = profileNames.split(/\s*[,;]\s*/);
                }
                raptor.forEach(profileNames, function(profileName) {
                    this.enableProfile(profileName);
                }, this);
            },
            
            setProfile: function(profileName) {
                this.enabledProfiles = {};
                this.enableProfile(profileName);
            },
            
            isProfileEnabled: function(profileName) {
                return this.enabledProfiles[profileName] === true;
            },
            
            registerPage: function(pageConfig) {
                var pageClassName,
                    viewFile = pageConfig.viewFile;
                
                if (viewFile) {
                    pageClassName = this.pageClassNamesByExt[viewFile.getExtension()];
                    
                    if (!pageClassName) {
                        pageClassName = "optimizer.PageStatic";
                    }
                }
                else {
                    pageClassName = "optimizer.Page";
                }
                
                if (pageConfig.packageFile) {
                    pageConfig.packageResource = raptor.require("resources").createFileResource(pageConfig.packageFile);
                }
                
                if (pageConfig.includes) {
                    pageConfig.packageManifest = raptor.require('packager').createPackageManifest(pageConfig.packageResource || this.getConfigResource());
                    pageConfig.packageManifest.setIncludes(pageConfig.includes);
                }
                else if (pageConfig.packageResource) {
                    pageConfig.packageManifest = raptor.require('packager').getPackageManifest(pageConfig.packageResource);
                }
                
                if (!pageConfig.packageManifest) {
                    throw raptor.createError(new Error("A packageManifest property is required for a page config. Alternatively, a packageResource or packageFile property can be provided."));
                }
                
                var PageClass = raptor.require(pageClassName);
                var page = new PageClass(pageConfig);
                this.pages.push(page);
                this.pagesByName[page.getKey()] = page;
                
                return page;
            },
            
            setConfigResource: function(configResource) {
                this.configResource = configResource;
            },
            
            getConfigResource: function() {
                return this.configResource;
            },
            
            getChecksumLength: function() {
                return this.checksumLength;
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
                                throw raptor.createError(new Error('Bundles not found with name "' + o.bundlesRef + '"'));
                            }
                            addBundles(referencedBundleSetDef);
                            return;
                        }
                        else if (o instanceof BundleDef) {
                            var bundleName = o.name;
                            
                            if (!bundleName) {
                                throw raptor.createError(new Error("Illegal state. Bundle name is required"));
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
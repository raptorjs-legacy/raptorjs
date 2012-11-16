raptor.defineClass(
    "optimizer.Config",
    function(raptor) {
        "use strict";
        
        var strings = raptor.require('strings'),
            BundleMappings = raptor.require('optimizer.BundleMappings');
        
        var Config = function(params) {
            this.configResource = null;
            this.outputDir = null;
            this.bundlingEnabled = true;
            this.checksumsEnabled = true;
            this.enabledProfiles = {};
            this.urlPrefix = null;
            this.enabledExtensions = raptor.require('packaging').createExtensionCollection();
            this.params = {};
            this.bundleSetConfigsByName = {};
            this.inPlaceDeploymentEnabled = false;
            this.serverSourceMappings = [];
            this.pageConfigs = [];
            this.pageConfigsByName = {};
            this.checksumLength = 8;
            this.filters = [];
            this.bundlingEnabled = true;
            this.raptorConfigJSON = '{}';
            this.minifyJs = false;
            this.minifyCss = false;
            
            if (params) {
                raptor.extend(this.params, params);
            }
        };
        
        Config.prototype = {

            getPageConfig: function(name) {
                return this.pageConfigsByName[name];
            },

            setUrlPrefix: function(urlPrefix) {
                this.urlPrefix = urlPrefix;
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
                
                for (var i=0, len=this.serverSourceMappings.length; i<len; i++) {
                    var mapping = this.serverSourceMappings[i];
                    if (strings.startsWith(path, mapping.baseDir)) {
                        var relativePath = path.substring(mapping.baseDir.length);
                        return mapping.baseUrl + relativePath;
                    }
                }
                
                return null;
            },
            
            getParam: function(name) {
                return this.params[name];
            },
            
            getParams: function() {
                return this.params;
            },
            
            addParam: function(name, value) {
                if (this.params.hasOwnProperty(name)) {
                    return; //Params are only write-once
                }
                this.params[name] = value;
            },
            
            getUrlPrefix: function() {
                return this.urlPrefix;
            },

            getOutputDir: function() {
                return this.outputDir;
            },
            
            addBundleSetConfig: function(bundleSetConfig) {
                var BundleSetConfig = raptor.require('optimizer.BundleSetConfig');
                
                if (!(bundleSetConfig instanceof BundleSetConfig)) {
                    bundleSetConfig = new BundleSetConfig(bundleSetConfig);
                }
                
                if (!bundleSetConfig.name) {
                    bundleSetConfig.name = "default";
                }
                
                if (this.bundleSetConfigsByName[bundleSetConfig.name]) {
                    throw raptor.createError(new Error('Bundles with name "' + bundleSetConfig.name + '" defined multiple times'));
                }
                
                this.bundleSetConfigsByName[bundleSetConfig.name] = bundleSetConfig;
                
                return bundleSetConfig;
            },
            
            getBundleSetConfig: function(name) {
                return this.bundleSetConfigsByName[name];
            },

            enableExtension: function(name) {
                
                this.enabledExtensions.add(name);
            },
            
            getEnabledExtensions: function() {
                return this.enabledExtensions;
            },
            
            isMinifyJsEnabled: function() {
                return this.minifyJs === true;
            },

            isMinifyCssEnabled: function() {
                return this.minifyCss === true;
            },
            
            enableMinification: function() {
                this.minifyJs = true;
                this.minifyCss = true;
            },

            isResolveCssUrlsEnabled: function() {
                return this.resolveCssUrls === true;
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
            
            registerPageConfig: function(pageConfig) {
                if (!pageConfig.name) {
                    throw raptor.createError(new Error('name is required for page'));
                }
                this.pageConfigs.push(pageConfig);
                this.pageConfigsByName[pageConfig.name] = pageConfig;
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
            
            getRaptorConfigJSON: function() {
                return this.raptorConfigJSON;
            },
            
            createBundleMappings: function(bundleSetConfig, enabledExtensions) {
                var BundleSetConfig = raptor.require('optimizer.BundleSetConfig'),
                    BundleConfig = raptor.require('optimizer.BundleConfig'),
                    bundleMappings = new BundleMappings(enabledExtensions);
                
                var config = this,
                    addBundles = function(o) {
                        if (o.enabled === false) {
                            return;
                        }
                        
                        if (o.ref) {
                            var referencedBundleSetConfig = config.getBundleSetConfig(o.ref);
                            if (!referencedBundleSetConfig) {
                                throw raptor.createError(new Error('Bundles not found with name "' + o.ref + '"'));
                            }
                            addBundles(referencedBundleSetConfig);
                            return;
                        }
                        else if (o instanceof BundleConfig) {
                            var bundleName = o.name;
                            
                            if (!bundleName) {
                                throw raptor.createError(new Error("Illegal state. Bundle name is required"));
                            }
                            
                            bundleMappings.addDependenciesToBundle(o.dependencies, bundleName, o.checksumsEnabled);
                        }
                        else if (o instanceof BundleSetConfig) {
                            o.forEachChild(addBundles);
                        }
                    };
                    
                addBundles(bundleSetConfig);
                return bundleMappings;
            },
                
            
            parseXml: function(xml, configFilePath) {
                var ConfigXmlParser = raptor.require('optimizer.ConfigXmlParser');
                var parser = new ConfigXmlParser();
                parser.parse(xml, configFilePath, this);
            },

            forEachPageConfig: function(callback, thisObj) {
                this.pageConfigs.forEach(callback, thisObj);
            }
        };
        
        return Config;
    });
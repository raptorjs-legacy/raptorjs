/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define("raptor/packaging", ['raptor'], function(raptor, require, exports, module) {
    "use strict";
    
    var forEachEntry = raptor.forEachEntry,
        mappings = {},
        logger = require('raptor/logging').logger('packaging-server'),
        packageManifests = {},
        enabledExtensions = null,
        dependencyClasses = {},
        discoveryComplete = false,
        searchPathListenerHandle = null,
        ExtensionCollection = require('raptor/packaging/ExtensionCollection'),
        PackageManifest = require('raptor/packaging/PackageManifest'),
        PackageLoader = require('raptor/packaging/PackageLoader'),
        getEnabledExtensions = function() {
            if (!enabledExtensions) {
                enabledExtensions = new ExtensionCollection();
            }
            return enabledExtensions;
        },
        createModuleManifestForResource = function(resource) {
            var manifest = require('raptor/packaging').createPackageManifest();
            manifest.setPackageResource(resource);
            manifest.setDependencies([{
                path: resource.getName()
            }]);

            return manifest;
        },
        getModuleDirPath = function(id) {
            return '/' + id.replace(/\./g, '/');
        },
        topLevelManifests = null;
    
    return {
        ExtensionCollection: ExtensionCollection,
        
        createExtensionCollection: function(enabledExtensions) {
            return new ExtensionCollection(enabledExtensions);
        },
        
        isExtensionCollection: function(extensions) {
            return extensions instanceof ExtensionCollection;
        },
        
        enableExtension: function(extensionName) {
            getEnabledExtensions().add(extensionName);
        },
        
        getEnabledExtensions: function() {
            return getEnabledExtensions();
        },
        
        /**
         *
         * @param resourcePath {String|packaging-PackageManifest}
         */
        load: function(resourcePath) {
            PackageLoader.instance.load(resourcePath, {enabledExtensions: getEnabledExtensions()});
        },
        
        _watchResourceSearchPath: function() {
            if (!searchPathListenerHandle) {
                searchPathListenerHandle = require('raptor/resources').getSearchPath().subscribe("modified", function() {
                    discoveryComplete = false;
                    this._doDiscovery(); //If the search path is modified then rediscover the
                }, this);
            }
        },
        
        _doDiscovery: function() {
            if (discoveryComplete) {
                return;
            }

            try
            {
                discoveryComplete = true;

                topLevelManifests = [];

                require('raptor/resources').forEach('/package.json', function(manifestResource) {
                    

                    var manifest = this.getPackageManifest(manifestResource);
                    topLevelManifests.push(manifest);

                    var manifestModuleMappings = manifest.getRaptorProp("module-mappings");
                    if (manifestModuleMappings) {
                        raptor.extend(mappings, manifestModuleMappings);
                    }


                    var manifestDependencyHandlers = manifest.getRaptorProp("dependency-types");
                    
                    if (manifestDependencyHandlers) {
                        forEachEntry(manifestDependencyHandlers, function(type, handlerInfo) {
                            if (handlerInfo.path) {
                                require('raptor/runtime').evaluateResource(handlerInfo.path);
                            }

                            try
                            {
                                var Dependency = require(typeof handlerInfo === 'string' ? handlerInfo : handlerInfo["class"]);
                                this.registerDependencyClass(type, Dependency);
                            }
                            catch(e) {
                                logger.error('Unable to register dependency type of "' + type + '". Exception: ' + e, e);
                            }
                            
                        }, this);
                    }

                }, this);
            }
            finally {
                this._watchResourceSearchPath();
            }
        },
        
        registerDependencyClass: function(type, dependencyClass) {
            dependencyClasses[type] = dependencyClass;
        },
        
        getDependencyClass: function(type) {
            this._doDiscovery();
            
            var dependencyClass = dependencyClasses[type];
            if (!dependencyClass) {
                throw raptor.createError(new Error('Dependency class not found for dependency of type "' + type + '"'));
            }
            return dependencyClass;
        },
        
        removePackageManifestFromCache: function(manifest) {
            delete packageManifests[manifest.getURL()];
        },
        
        isPackageManifest: function(o) {
            return o instanceof PackageManifest;
        },
        
        createPackageManifest: function(loadedManifest, packageResource) {
            var manifest = new PackageManifest();
            if (packageResource) {
                manifest.setPackageResource(packageResource);
            }

            if (loadedManifest) {
                raptor.extend(manifest, loadedManifest);
                
                if (loadedManifest.hasOwnProperty("raptor")) {
                    var raptorObj = loadedManifest.raptor;
                    if (raptorObj) {
                        manifest.setDependencies(raptorObj.dependencies);
                        manifest.setExtensions(raptorObj.extensions);
                    }
                }
                else if (Array.isArray(loadedManifest.includes) || Array.isArray(loadedManifest.dependencies)) {
                    manifest.setDependencies(loadedManifest.includes || loadedManifest.dependencies);
                    manifest.setExtensions(loadedManifest.extensions);
                }
                else {
                    // clear out the dependencies and extensions becuase the
                    // manifest does not belong to a raptor module
                    manifest.setDependencies(null);
                    manifest.setExtensions(null);
                }
            }
            return manifest;
        },
        
        /**
         *
         * @param resourcePath
         * @returns
         */
        getPackageManifest: function(resourcePath) {
            
            var resources = require('raptor/resources'),
                packageResource;
            
            if (resources.isResource(resourcePath)) {
                packageResource = resourcePath;
                resourcePath = packageResource.getPath();
            }
            else {
                packageResource = resources.findResource(resourcePath);
            }
            
            if (!packageResource.exists()) {
                return null;
            }
            
            var manifest = packageManifests[packageResource.getURL()];
            if (manifest === undefined)
            {
                var packageJson = packageResource.readAsString("UTF-8"),
                    loadedManifest;
                try
                {
                    loadedManifest = JSON.parse(packageJson);
                }
                catch(e) {
                    throw raptor.createError(new Error('Unable to parse module manifest at path "' + packageResource.getURL() + '". Exception: ' + e + '\n\nJSON:\n' + packageJson), e);
                }
                
                manifest = this.createPackageManifest(loadedManifest, packageResource);
                packageManifests[packageResource.getURL()] = manifest;
            }
            return manifest;
        },
        
        /**
         *
         * @param callback {Function}
         * @param thisObj {Object}
         */
        forEachTopLevelPackageManifest: function(callback, thisObj) {
            this._doDiscovery();
            topLevelManifests.forEach(callback, thisObj);
        },
        
        getModuleManifest: function(name) {
            this._doDiscovery();

            var target = mappings[name],
                manifest,
                packaging = this;

            if (target && require('raptor/strings').endsWith(target, "package.json")) {
                return packaging.getPackageManifest(target);
            }
            else if (target) {
                return this.getModuleManifest(target);
            }
            else {
                var dir = getModuleDirPath(name);
                
                manifest = packaging.getPackageManifest(dir + "/package.json");
                if (!manifest) {
                    manifest = packaging.getPackageManifest(dir + "-package.json");
                }
                
                if (!manifest) {
                    /*
                     * Sample module name:
                     * my-module.sub-module
                     */
                    
                    if (!name.endsWith('.js') && !name.endsWith('/js')) {
                        var resources = require('raptor/resources');
                        var basePath = '/' + name.replace(/\./g, '/'); //sample basePath: /my-module/sub-module
                        var resourcePath = basePath + '.js'; //sample resourcePath: /my-module/sub-module.js
                        
                        var resource = resources.findResource(resourcePath);

                        if (resource && resource.exists())
                        {
                            manifest = createModuleManifestForResource(resource);
                        }
                        else {
                            var lastSlash = basePath.lastIndexOf('/');
                            if (lastSlash != -1) {
                                resourcePath =  basePath + '/' + basePath.substring(lastSlash+1) + ".js"; //sample resourcePath: /my-module/sub-module/sub-module.js
                                resource = resources.findResource(resourcePath);
                                if (resource.exists())
                                {
                                    manifest = createModuleManifestForResource(resource);
                                }
                            }
                        }
                    }
                    
                    

                }
            }

            if (manifest) {
                manifest.setName(name);
            }
            
            return manifest;
        },

        clearCache: function() {
            packageManifests = {};
        },

        createDependency: PackageManifest.createDependency
    };

});
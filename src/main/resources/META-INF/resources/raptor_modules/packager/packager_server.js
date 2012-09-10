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

$rload(function(raptor) {
    "use strict";
    
    var arrays = raptor.arrays,
        forEachEntry = raptor.forEachEntry,
        logger = raptor.logging.logger('packager-server'),
        packageManifests = {},
        enabledExtensions = null,
        includeClasses = {},
        discoveryComplete = false,
        searchPathListenerHandle = null,
        getEnabledExtensions = function() {
            if (!enabledExtensions) {
                var ExtensionCollection = raptor.ExtensionCollection;
                enabledExtensions = new ExtensionCollection();    
            }
            return enabledExtensions;
        };
    
    /**
     * @namespace
     * @raptor
     * @name packager
     */
    raptor.packager = /** @lends packager */ {
        ExtensionCollection: raptor.ExtensionCollection,
        
        createExtensionCollection: function(enabledExtensions) {
            var ExtensionCollection = this.ExtensionCollection;
            return new ExtensionCollection(enabledExtensions);
        },
        
        isExtensionCollection: function(extensions) {
            var ExtensionCollection = this.ExtensionCollection;
            return extensions instanceof ExtensionCollection;
        },
        
        config: raptor.config.create({
            "enabledExtensions": {
                value: raptor.getModuleConfig('packager').enabledExtensions,
                onChange: function(value) {
                    arrays.forEach(value, function(ext) {
                        getEnabledExtensions().add(ext);
                    });
                }
            }
        }),
        
        enableExtension: function(extensionName) {
            getEnabledExtensions().add(extensionName);
        },
        
        getEnabledExtensions: function() {
            return getEnabledExtensions();
        },
        
        /**
         * 
         * @param resourcePath {String|packager-PackageManifest}
         */
        load: function(resourcePath) {
            this.PackageLoader.instance.load(resourcePath, {enabledExtensions: getEnabledExtensions()});
        },
        
        _watchResourceSearchPath: function() {
            if (!searchPathListenerHandle) {
                searchPathListenerHandle = raptor.resources.getSearchPath().subscribe("modified", function() {
                    discoveryComplete = false;
                    this._doDiscovery(); //If the search path is modified then rediscover the 
                }, this);
            }
        },
        
        _doDiscovery: function() {
            if (discoveryComplete) {
                return;
            }
            discoveryComplete = true;
            
            this.forEachTopLevelPackageManifest(function(manifest) {
                var manifestIncludeHandlers = manifest["raptor-include-types"];
                
                if (manifestIncludeHandlers) {
                    forEachEntry(manifestIncludeHandlers, function(type, handlerInfo) {
                        if (handlerInfo.path) {
                            raptor.runtime.evaluateResource(handlerInfo.path);
                        }
                        var Include = raptor.require(handlerInfo["class"]);
                        this.registerIncludeClass(type, Include);
                    }, this);
                }
                
            }, this);
            
            this._watchResourceSearchPath();
        },
        
        registerIncludeClass: function(type, includeClass) {
            includeClasses[type] = includeClass; 
        },
        
        getIncludeClass: function(type) {
            this._doDiscovery();
            
            var includeClass = includeClasses[type];
            if (!includeClass) {
                throw raptor.createError(new Error('Include class not found for include of type "' + type + '"'));
            }
            return includeClass;
        },
        
        removePackageManifestFromCache: function(manifest) {
            delete packageManifests[manifest.getSystemPath()];
        },
        
        createPackageManifest: function(packageResource) {
            var PackageManifest = this.PackageManifest;
            var manifest = new PackageManifest();
            manifest.setPackageResource(packageResource);
            return manifest;
        },
        
        /**
         * 
         * @param resourcePath
         * @returns
         */
        getPackageManifest: function(resourcePath) {
            
            var resources = raptor.resources,
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
            
            var manifest = packageManifests[packageResource.getSystemPath()];
            if (manifest === undefined)
            {
                var packageJson = packageResource.readFully(),
                    loadedManifest;
                try
                {
                    loadedManifest = JSON.parse(packageJson);
                }
                catch(e) {
                    throw raptor.createError(new Error('Unable to parse module manifest at path "' + packageResource.getSystemPath() + '". Exception: ' + e + '\n\nJSON:\n' + packageJson), e);
                }
                
                manifest = this.createPackageManifest(packageResource);
                raptor.extend(manifest, loadedManifest);
                
                manifest.setIncludes(loadedManifest.includes);
                manifest.setExtensions(loadedManifest.extensions);
                
                packageManifests[packageResource.getSystemPath()] = manifest;
            }
            return manifest;
        },
        
        /**
         * 
         * @param callback {Function}
         * @param thisObj {Object}
         */
        forEachTopLevelPackageManifest: function(callback, thisObj) {
            raptor.resources.forEach('/package.json', function(manifestResource) {
                var manifest = this.getPackageManifest(manifestResource);
                callback.call(thisObj, manifest);
            }, this);
        }
    };

});
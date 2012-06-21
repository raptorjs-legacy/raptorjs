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
    
    var errors = raptor.errors,
        arrays = raptor.arrays,
        forEachEntry = raptor.forEachEntry,
        logger = raptor.logging.logger('packaging-server'),
        packageManifests = {},
        _extensionsLookup = {},
        includeHandlers = {},
        discoveryComplete = false,
        searchPathListenerHandle = null;
    
    /**
     * 
     */
    raptor.defineCore('packaging', {
        config: raptor.config.create({
            "enabledExtensions": {
                value: raptor.getModuleConfig('packaging').enabledExtensions,
                onChange: function(value) {
                    _extensionsLookup = {};
                    
                    arrays.forEach(value, function(ext) {
                        _extensionsLookup[ext] = true;
                    });
                }
            }
        }),
        
        enableExtension: function(extensionName) {
            _extensionsLookup[extensionName] = true;
        },
        
        /**
         * 
         * @param resourcePath {String|packaging-PackageManifest}
         */
        loadPackage: function(resourcePath) {
            this.PackageLoader.instance.loadPackage(resourcePath, {enabledExtensions: _extensionsLookup});
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
                var manifestIncludeHandlers = manifest["include-handlers"];
                
                if (manifestIncludeHandlers) {
                    forEachEntry(manifestIncludeHandlers, function(type, handlerInfo) {
                        if (handlerInfo.path) {
                            raptor.runtime.evaluateResource(handlerInfo.path);
                        }
                        var HandlerClass = raptor.require(handlerInfo["class"]);
                        if (!HandlerClass.instance) {
                            HandlerClass.instance = new HandlerClass();
                        }
                        this.registerIncludeHandler(type, HandlerClass.instance);
                    }, this);
                }
                
            }, this);
            
            this._watchResourceSearchPath();
        },
        
        registerIncludeHandler: function(type, handler) {
            includeHandlers[type] = handler; 
        },
        
        getIncludeHandler: function(type) {
            this._doDiscovery();
            
            var handler = includeHandlers[type];
            if (!handler) {
                raptor.errors.throwError(new Error('Handler not found for include of type "' + type + '"'));
            }
            return handler;
        },
        
        /**
         * 
         * @param resourcePath
         * @returns
         */
        getPackageManifest: function(resourcePath) {
            
            var resources = raptor.resources,
                packageResource;
            
            if (resources.isResourceInstance(resourcePath)) {
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
                var packageDirPath;

                if (!packageResource.exists())
                {
                    return null;
                }
                
                
                resourcePath = packageResource.getPath();

                packageDirPath = resourcePath.substring(0, resourcePath.lastIndexOf("/"));
                
                logger.debug('Found package manifest: ' + packageResource.getSystemPath());
                
                var packageJson = packageResource.readFully();
                try
                {
                    manifest = JSON.parse(packageJson);
                }
                catch(e) {
                    errors.throwError(new Error('Unable to parse module manifest at path "' + packageResource.getSystemPath() + '". Exception: ' + e + '\n\nJSON:\n' + packageJson), e);
                }
                
                raptor.extend(manifest, this.PackageManifest);
                manifest.init(packageDirPath, packageResource);
                
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
    });

});
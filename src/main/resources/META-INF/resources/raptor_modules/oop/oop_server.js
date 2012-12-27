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
    
    var logger = raptor.logging.logger('oop-server'),
        oop = raptor.oop,
        getModuleDirPath = function(name) {
            return '/' + name.replace(/\./g, '/');
        },
        resolveModuleResource = function(name) {
            var resources = raptor.resources;
            
            var resourcePath = '/' + name.replace(/\./g, '/') + '.js';
            
            var resource = resources.findResource(resourcePath);
            if (resource.exists())
            {
                logger.debug('Found missing class: ' + name);
                
                raptor.runtime.evaluateResource(resource);
                
                var o = oop._load(name, false /* Do not find again or infinite loop will result */);

                if (!o)
                {
                    var pathToFile = resource.getSystemPath();
                    
                    //The file existed for the class by the class itself
                    //was not found so throw an error since the developer
                    //probably named the class incorrectly.
                    throw raptor.createError(new Error('Definition with name "' + name + '" not found in file "' + pathToFile + '"'));
                }
                else
                {   
                    return o;
                }
            }
            else
            {
                return undefined;                
            }
        },
        resolveModulePackage = function(name, manifest) {
            if (!manifest) {
                manifest = oop.getModuleManifest(name);
            }
            
            
            if (!manifest) {
                return undefined;
            } 
            
            raptor.require('packaging').load(manifest);
            
            var module = oop._load(name, false /* Do not find again or infinite loop will result */);
            return module;
        },
        createModuleManifestForResource = function(resource) {
            var manifest = raptor.require('packaging').createPackageManifest();
            manifest.setPackageResource(resource);
            manifest.setDependencies([{
                path: resource.getName()
            }]);

            return manifest;
        },
        mappings = {},
        addMappings = function(_mappings) {
            raptor.extend(mappings, _mappings);
        },
        searchPathListenerHandle,
        discoveryComplete = false,
        missing = {};
    
    /**
     * @extension Server
     */
    raptor.extendCore('oop', {
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
            
            raptor.require('packaging').forEachTopLevelPackageManifest(function(manifest) {
                var manifestMappings = manifest.getRaptorProp("module-mappings");
                
                if (manifestMappings) {
                    addMappings(manifestMappings);
                }

            }, this);
            
            this._watchResourceSearchPath();
        },
        
        /**
         * Attempts to load the package for the specified module
         * 
         * @param name The name of the class/module/mixin/enum
         * @returns void
         */
        load: function(name) {
            var manifest;
            
            if (!missing[name]) {
                manifest = oop.getModuleManifest(name); 
            }
            
            if (!manifest) {
                missing[name] = true;
                oop._missing(name);
            }
            else {
                manifest.load();    
            }
        },
        
        /**
         * 
         * @protected
         * 
         * @param name
         * @returns
         */
        _resolve: function(name) {
            this._doDiscovery();
            
            var o = resolveModuleResource(name);
            if (o === undefined) {
                o = resolveModulePackage(name);
            }
            return o;
        },
        
        _missing: function(name) {
            throw raptor.createError(new Error('require failed. "' + name + '" not found. Search path:\n' + raptor.resources.getSearchPathString()));
        },
        
        /**
         * 
         * @param name
         * @returns
         */
        getModuleManifest: function(name) {
            var path = mappings[name],
                manifest,
                packaging = raptor.require('packaging');

            if (path) {
                manifest = packaging.getPackageManifest(path);
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
                    var resources = raptor.resources;
                    var basePath = '/' + name.replace(/\./g, '/'); //sample basePath: /my-module/sub-module
                    var resourcePath = basePath + '.js'; //sample resourcePath: /my-module/sub-module.js
                    
                    var resource = resources.findResource(resourcePath);
                    if (resource.exists())
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

            if (manifest) {
                manifest.setName(name);    
            }
            
            return manifest;
        },
        
        uncache: function(name) {
            delete raptor.oop.cache[name];
        }
    });
    
    raptor.load = raptor.oop.load;
    raptor.uncache = raptor.oop.uncache;
});


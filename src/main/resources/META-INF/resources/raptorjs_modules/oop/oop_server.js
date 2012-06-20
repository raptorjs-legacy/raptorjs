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
        errors = raptor.errors,
        oop = raptor.oop,
        getModuleDirPath = function(name) {
            return '/' + name.replace(/\./g, '/');
        },
        loaded = {},
        findMissingClass = function(name) {
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
                    errors.throwError(new Error('Definition with name "' + name + '" not found in file "' + pathToFile + '"'));
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
        findMissingModule = function(name, manifest) {
            if (!manifest) {
                manifest = oop.getModuleManifest(name);
            }
            
            
            if (!manifest) {
                return undefined;
            } 
            
            raptor.packaging.loadPackage(manifest);
            
            var module = oop._load(name, false /* Do not find again or infinite loop will result */);
            return module;
        },
        mappings = {},
        addMappings = function(_mappings) {
            raptor.extend(mappings, _mappings);
        },
        searchPathListenerHandle,
        discoveryComplete = false;
    
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
                var manifestMappings = manifest["raptor-module-mappings"];
                
                if (manifestMappings) {
                    addMappings(manifestMappings);
                }

            }, this);
            
            this._watchResourceSearchPath();
        },
        
        /**
         * 
         * @protected
         * 
         * @param name
         * @returns
         */
        _find: function(name) {
            this._doDiscovery();
            
            var o = findMissingClass(name);
            if (o === undefined) {
                o = findMissingModule(name);
            }
            return o;
        },
        
        _missing: function(name) {
            errors.throwError(new Error('require failed. "' + name + '" not found. Search path:\n' + raptor.resources.getSearchPathString()));
        },
        
        /**
         * 
         * @param name
         * @returns
         */
        getModuleManifest: function(name) {
            var path = mappings[name];
            if (name == 'taglib/widgets') {
                console.error(mappings);                
            }
            
            if (!path) {
                path = getModuleDirPath(name) + "/package.json";
            }
            else {
                console.error('Found mapping: ', path);
            }
            return raptor.packaging.getPackageManifest(path);
        }
    });
});


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
                
                var loaded = oop._load(name, false /* Do not find again or infinite loop will result */);

                if (!loaded)
                {
                    var pathToFile = resource.getSystemPath();
                    
                    //The file existed for the class by the class itself
                    //was not found so throw an error since the developer
                    //probably named the class incorrectly.
                    errors.throwError(new Error('Definition with name "' + name + '" not found in file "' + pathToFile + '"'));
                }
                else
                {   
                    return loaded;
                }
            }
            else
            {
                return undefined;                
            }
        },
        findMissingModule = function(name) {
            var manifest = oop.getModuleManifest(name);
            
            if (!manifest) {
                return undefined;
            } 
            
            raptor.packaging.loadPackage(manifest);
            
            var module = oop._load(name, false /* Do not find again or infinite loop will result */);
            return module;
        };
    
    /**
     * @extension Server
     */
    raptor.extendCore('oop', {
        /**
         * 
         * @protected
         * 
         * @param name
         * @returns
         */
        _find: function(name) {
            var loaded = findMissingClass(name);
            if (loaded === undefined) {
                loaded = findMissingModule(name);
            }
            return loaded;
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
            return raptor.packaging.getPackageManifest(this.getModuleManifestPath(name));
        },
        
        getModuleManifestPath: function(name) {
            return getModuleDirPath(name) + "/package.json";
        }
    });
});


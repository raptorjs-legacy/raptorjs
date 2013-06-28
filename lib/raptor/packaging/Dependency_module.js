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

define.Class(
    "raptor/packaging/Dependency_module",
    "raptor/packaging/Dependency",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var Dependency_module = function() {
            Dependency_module.superclass.constructor.apply(this, arguments);
            this.addProperty("name", {
                type: "string"
            });
        };
        
        Dependency_module.prototype = {
            getKey: function() {
                return "module:" + this.name;
            },
            
            toString: function() {
                return "[module: " + this.name + "]";
            },
            
            load: function(context) {
                var moduleName = this.name;
                
                if (context.isLoaded(moduleName)) {
                    return;
                }
                context.setLoaded(moduleName);
                
                var newManifest = require('raptor/packaging').getModuleManifest(moduleName);
                if (!newManifest) {
                    throw new Error('Module not found with name "' + moduleName + '" in manifest ' + this.getParentManifestSystemPath());
                }
                require('raptor/packaging').load(newManifest);
            },

            getManifest: function() {
                var manifest = require('raptor/packaging').getModuleManifest(this.name);
                if (!manifest) {
                    throw raptor.createError(new Error('Package manifest not found for module "' + this.name + '" in referenced manifest at path "' + this.getParentManifestSystemPath() + '"'));    
                }
                return manifest;
            },
            
            isPackageDependency: function() {
                return true;
            }
        };

        return Dependency_module;
    });



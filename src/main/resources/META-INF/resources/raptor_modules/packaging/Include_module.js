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

raptor.define(
    "packaging.Include_module",
    "packaging.Include",
    function(raptor) {
        "use strict";
        
        var Include_module = function() {
            Include_module.superclass.constructor.apply(this, arguments);
            this.addProperty("name", {
                type: "string"
            });
        };
        
        Include_module.prototype = {
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
                
                var newManifest = raptor.oop.getModuleManifest(moduleName);
                raptor.packaging.load(newManifest);
            },

            getManifest: function() {
                var manifest = raptor.oop.getModuleManifest(this.name);
                if (!manifest) {
                    throw raptor.createError(new Error('Package manifest not found for module "' + this.name + '"'));    
                }
                return manifest;
            },
            
            isPackageInclude: function() {
                return true;
            }
        };

        return Include_module;
    });



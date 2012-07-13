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

raptor.defineClass(
    "packager.Include_module",
    "packager.Include",
    function(raptor) {
        "use strict";
        
        return {
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
                raptor.packager.loadPackage(newManifest);
            },

            getManifest: function() {
                return raptor.oop.getModuleManifest(this.name);
            },
            
            isPackageInclude: function() {
                return true;
            }
        };
    });



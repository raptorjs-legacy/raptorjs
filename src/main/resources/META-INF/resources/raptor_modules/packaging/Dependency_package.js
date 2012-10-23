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
    "packaging.Dependency_package",
    "packaging.Dependency",
    function(raptor) {
        "use strict";
        
        var Dependency_package = function() {
            Dependency_package.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_package.prototype = {
            getKey: function() {
                return "package:" + this.path;
            },
            
            toString: function() {
                return "[package: " + this.path + "]";
            },
            
            load: function(context) {
                if (!this.path) {
                    console.error("Invalid package dependency: ", this);
                    throw raptor.createError("Invalid package dependency");
                }
                raptor.packaging.load(this.path);
            },

            getManifest: function() {
                var manifest = raptor.packaging.getPackageManifest(this.path);
                if (!manifest) {
                    throw raptor.createError(new Error('Package manifest not found at path "' + this.path + '"'));    
                }
                return manifest;
            },
            
            isPackageDependency: function() {
                return true;
            }
        };

        return Dependency_package;
    });



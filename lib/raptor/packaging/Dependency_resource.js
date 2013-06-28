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
    "raptor/packaging/Dependency_resource",
    "raptor/packaging/Dependency",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";

        var Dependency_resource = function() {
            Dependency_resource.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Dependency_resource.prototype = {
            
            invalidDependency: function() {
                throw raptor.createError(new Error('Invalid taglib dependency of "rtld" found in package at path "' + this.getParentManifestSystemPath() + '"'));
            },
            
            getKey: function(context) {
                if (this.path) {
                    return "resource:" + this.resolvePathKey(this.path, context);
                }
                else {
                    this.invalidDependency();
                }
            },

            getContentType: function() {
                return "application/javascript";
            },
            
            getResourcePath: function() {
                return this.path;
            },
            
            getCode: function(context) {
                
                if (this.path) {
                    
                    var taglibResource = this.getResource(context);
                    if (!taglibResource.exists()) {
                        throw raptor.createError(new Error('Resource with path "' + this.path + '" not found in package at path "' + this.getManifest().getPackageResource().getURL() + '"'));
                    }
                    return '$rset("resource","' + taglibResource.getPath() + '",' + JSON.stringify(taglibResource.readAsString("UTF-8")) + ');';
                }
                else {
                    this.invalidDependency();
                }
            },
            
            isCompiled: function() {
                return true;
            }
        };

        return Dependency_resource;
    });

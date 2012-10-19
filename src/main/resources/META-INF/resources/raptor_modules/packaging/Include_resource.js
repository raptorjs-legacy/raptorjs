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
    "packaging.Include_resource",
    "packaging.Include",
    function(raptor) {
        "use strict";

        var Include_resource = function() {
            Include_resource.superclass.constructor.apply(this, arguments);
            this.addProperty("path", {
                type: "string"
            });
        };
        
        Include_resource.prototype = {
            
            invalidInclude: function() {
                throw raptor.createError(new Error('Invalid taglib include of "rtld" found in package at path "' + this.getParentManifestSystemPath() + '"'));
            },
            
            getKey: function() {
                if (this.path) {
                    return "resource:" + this.resolvePathKey(this.path);
                }
                else {
                    this.invalidInclude();
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
                        throw raptor.createError(new Error('Resource with path "' + this.path + '" not found in package at path "' + this.getManifest().getPackageResource().getSystemPath() + '"'));
                    }
                    return '$rset("resource","' + taglibResource.getPath() + '",' + JSON.stringify(taglibResource.readAsString("UTF-8")) + ');';
                }
                else {
                    this.invalidInclude();
                }
            },
            
            isCompiled: function() {
                return true;
            }
        };

        return Include_resource;
    });

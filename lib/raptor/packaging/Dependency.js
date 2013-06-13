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
    "raptor/packaging/Dependency",
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var runtime = require('raptor/runtime');
        

        var Dependency = function() {
            this.properties = {};

            this.addProperty("recursive", {
                type: "boolean"
            });

            this.addProperty("inline", {
                type: "boolean"
            });
        };
        
        Dependency.prototype = {
            __dependency: true,

            addProperty: function(name, config) {
                this.properties[name] = config;
            },

            getPropertyType: function(name) {
                var prop = this.properties[name];
                return (prop ? prop.type : "string") || "string";
            },
            
            getParentManifest: function() {
                return this._manifest;
            },
            
            getSlot: function() {
                if (this.slot) {
                    return this.slot;
                }
                
                var contentType = this.getContentType();
                if (contentType === 'text/css') {
                    return this.getStyleSheetSlot();
                }
                else {
                    return this.getJavaScriptSlot();
                }
            },

            hasModifiedChecksum: function() {
                return false;
            },
            
            getParentManifestSystemPath: function() {
                var parentManifest = this.getParentManifest();
                return parentManifest && parentManifest.getPackageResource() ? parentManifest.getPackageResource().getURL() : "(no package)";
            },
            
            setParentManifest: function(manifest) {
                this._manifest = manifest;
            },
            
            resolveResource: function(path, context) {
                var relative = path.charAt(0) !== '/',
                    manifest = this.getParentManifest();
            
                if (relative) {
                    if (!manifest) {
                        throw raptor.createError(new Error("Unable to resolve path  '" + path + '" for dependency. Manifest not provided'));    
                    }

                    var resource = manifest.resolveResource(path);
                    if (!resource || !resource.exists()) {
                        resource = require('raptor/resources').createFileResource(path);
                        if (!resource || !resource.exists()) {
                            throw raptor.createError(new Error('Resource "' + path + '" not found for package ' + manifest.getURL()));
                        }
                    }
                    return resource;
                }
                else {
                    var resource = require('raptor/resources').findResource(path);
                    if (!resource || !resource.exists()) {
                        resource = require('raptor/resources').createFileResource(path);
                        if (!resource || !resource.exists()) {
                            throw raptor.createError(new Error('Resource "' + path + '" not found with path ' + path));
                        }
                    }
                    return resource;
                }
            },
            
            resolvePathKey: function(path, context) {
                var resource = this.resolveResource(path, context);
                if (resource) {
                    return resource.getURL();
                }
                else {
                    var manifest = this.getParentManifest();
                    return path + ":" + (manifest ? ":" + manifest.getURL() : "");                    
                }
            },
            
            load: function(context) {
                var contentType = this.getContentType();
                if (contentType != 'application/javascript') {
                    throw raptor.createError(new Error('Unable to load dependency "' + this.toString() + '". Expected content type of "application/javascript". Actual content type: ' + contentType));
                }
                
                var resource = this.getResource(),
                path = resource.getURL();
                
                if (context.isLoaded(path)) {
                    return;
                }
                
                context.setLoaded(path);
                
                runtime.evaluateResource(resource);
            },
            
            getKey: function() {
                throw raptor.createError(new Error("getKey() not implemented for dependency: " + this.toString()));
            },
            
            getCode: function(context) {
                if (this.getResource) {
                    var resource = this.getResource();
                    if (resource.exists()) {
                        return resource.readAsString("UTF-8");
                    }
                    else {
                        throw raptor.createError(new Error('Unable to get code for dependency "' + this.toString() + '". Resource does not exist: ' + resource.getPath()));
                    }
                }
                
                throw raptor.createError(new Error("getCode() not implemented for dependency: " + this.toString()));
            },
            
            getContentType: function() {
                throw raptor.createError(new Error("getContentType() not implemented for dependency: " + this.toString()));
            },
            
            isPackageDependency: function() {
                return false;
            },
            
            toString: function() {
                if (this.getResourcePath()) {
                    return this.getResource().getPath();
                }
                else {
                    return this.getKey();
                }
            },
            
            getResourcePath: function(context) {
                return null;
            },

            getResource: function(context) {
                if (this._resource === undefined) {
                    var resourcePath = this.getResourcePath(context);
                    
                    this._resource = resourcePath ? this.resolveResource(resourcePath, context) : null;
                    if (!this._resource) {
                        this._resource = null;
                    }
                }
                return this._resource;
                
            },
            
            isAsync: function() {
                return this.async === true;
            },
            
            isCompiled: function() {
                return false;
            },
            
            isInPlaceDeploymentAllowed: function() {
                return false;
            },

            isExternalResource: function() {
                return false;
            },

            getJavaScriptSlot: function() {
                return this['js-slot'] || this['slot'];
            },

            getStyleSheetSlot: function() {
                return this['css-slot'] || this['slot'];
            }
        };
        
        return Dependency;
    });

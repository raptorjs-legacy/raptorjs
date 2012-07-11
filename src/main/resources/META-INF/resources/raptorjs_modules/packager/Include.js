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
    "packager.Include",
    function(raptor) {
        "use strict";
        
        var runtime = raptor.require('runtime')
        
        return {
            __include: true,
            
            getParentManifest: function() {
                return this._manifest;
            },
            
            getLocation: function() {
                if (this.location) {
                    return this.location;
                }
                var contentType = this.getContentType();
                return contentType === 'text/css' ? "head" : "body";
            },
            
            getParentManifestSystemPath: function() {
                var parentManifest = this.getParentManifest();
                return parentManifest ? parentManifest.getPackageResource().getSystemPath() : "(no package)";
            },
            
            setParentManifest: function(manifest) {
                this._manifest = manifest;
            },
            
            resolveResource: function(path, context) {
                var relative = path.charAt(0) !== '/',
                    manifest = this.getParentManifest();
            
                if (relative && !manifest) {
                    raptor.throwError(new Error("Unable to resolve path  '" + path + '" for include. Manifest not provided'));
                }
                else {
                    return manifest.resolveResource(path);                    
                }
            },
            
            resolvePathKey: function(path) {
                var relative = path.charAt(0) !== '/',
                    manifest = this.getParentManifest();
                
                if (relative && !manifest) {
                    raptor.throwError(new Error("Unable to resolve path  '" + path + '" for include. Manifest not provided'));
                }
                else {
                    return path + ":" + (manifest ? ":" + manifest.getSystemPath() : "");                    
                }
            },
            
            load: function(context) {
                var contentType = this.getContentType();
                if (contentType != 'application/javascript') {
                    raptor.throwError(new Error('Unable to load include "' + this.toString() + '". Expected content type of "application/javascript". Actual content type: ' + contentType));
                }
                
                var resource = this.getResource(),
                path = resource.getSystemPath();
                
                if (context.isLoaded(path)) {
                    return;
                }
                
                context.setLoaded(path);
                
                runtime.evaluateResource(resource);
            },
            
            getKey: function() {
                raptor.throwError(new Error("getKey() not implemented for include: " + this.toString()));
            },
            
            getCode: function(context) {
                if (this.getResource) {
                    var resource = this.getResource();
                    if (resource.exists()) {
                        return resource.readFully();
                    }
                    else {
                        raptor.throwError(new Error('Unable to get code for include "' + this.toString() + '". Resource does not exist: ' + resource.getPath()));
                    }
                }
                
                raptor.throwError(new Error("getCode() not implemented for include: " + this.toString()));
            },
            
            getContentType: function() {
                raptor.throwError(new Error("getContentType() not implemented for include: " + this.toString()));
            },
            
            isPackageInclude: function() {
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
            
            getResource: function(context) {
                if (this._resource === undefined) {
                    this._resource = this.resolveResource(this.getResourcePath(), context);
                    if (!this._resource) {
                        this._resource = null;
                    }
                }
                return this._resource;
                
            },
            
            isAsync: function() {
                return this.async === true;
            }
        };
    });

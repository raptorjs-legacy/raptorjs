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
    "packager.Include_rtld",
    "packager.Include",
    function(raptor) {
        "use strict";

        return {
            
            invalidInclude: function() {
                var stringify = raptor.require('json.stringify').stringify;
                raptor.throwError(new Error('Invalid taglib include of "rtld" found in package at path "' + this.getParentManifestSystemPath() + '"'));
            },
            getKey: function() {
                if (this.path) {
                    return "rtld:" + this.resolvePathKey(this.path);
                }
                else {
                    this.invalidInclude();
                }
            },
            
            load: function(context) {
                
                if (this.path) {
                    //console.log('load_taglib: Loading taglib at path "' + include.path + '"...');
                    
                    
                    var taglibResource = this.resolveResource(this.path, context);
                    if (!taglibResource.exists()) {
                        raptor.throwError(new Error('Taglib with path "' + this.path + '" not found in package at path "' + this.getManifest().getPackageResource().getSystemPath() + '"'));
                    }
                    //console.log('load_taglib: taglibResource "' + taglibResource.getSystemPath() + '"');
                    
                    raptor.require("templating.compiler").loadTaglibXml(taglibResource.readFully(), taglibResource.getSystemPath());
                }
                else {
                    this.invalidInclude();
                }
            },
            
            getContentType: function() {
                return "application/javascript"
            },
            
            getResourcePath: function() {
                return this.path;
            },
            
            getCode: function(context) {
                if (this.path) {
                    var taglibResource = this.getResource();
                    if (!taglibResource.exists()) {
                        raptor.throwError(new Error('Taglib with path "' + this.path + '" not found in package at path "' + this.getManifest().getPackageResource().getSystemPath() + '"'));
                    }
                    
                    var taglibJS = raptor.require("templating.compiler").compileTaglib(taglibResource.readFully(), taglibResource.getSystemPath());
                    return taglibJS;
                }
                else {
                    this.invalidInclude();
                }
            }
        };
    });

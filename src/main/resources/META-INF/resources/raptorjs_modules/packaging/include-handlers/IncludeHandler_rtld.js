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
    "packaging.include-handlers.IncludeHandler_rtld",
    "packaging.IncludeHandler",
    function() {
        return {
            includeKey: function(include) {
                return "rtld:" + (include.uri || uri.path);
            },
            
            load: function(include, manifest) {
                
                if (include.uri) {
                    raptor.require("templating.compiler").loadTaglibPackage(include.uri);
                }
                else if (include.path) {
                    //console.log('load_taglib: Loading taglib at path "' + include.path + '"...');
                    
                    
                    var taglibResource = manifest.resolveResource(include.path);
                    if (!taglibResource.exists()) {
                        raptor.throwError(new Error('Taglib with path "' + include.path + '" not found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                    }
                    //console.log('load_taglib: taglibResource "' + taglibResource.getSystemPath() + '"');
                    
                    raptor.require("templating.compiler").loadTaglibXml(taglibResource.readFully(), taglibResource.getSystemPath());
                }
                else {
                    var stringify = raptor.require('json.stringify').stringify;
                    raptor.throwError(new Error('Invalid taglib include of ' + stringify(include) + '" found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                }
            },
            
            aggregate: function(include, manifest, aggregator) {
                if (include.path) {
                    var taglibResource = manifest.resolveResource(include.path);
                    if (!taglibResource.exists()) {
                        raptor.throwError(new Error('Taglib with path "' + include.path + '" not found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                    }
                    
                    var taglibJS = raptor.require("templating.compiler").compileTaglib(taglibResource.readFully(), taglibResource.getSystemPath());
                    aggregator.addJavaScriptCode(taglibJS, taglibResource.getSystemPath());
                }
                else {
                    var stringify = raptor.require('json.stringify').stringify;
                    raptor.throwError(new Error('Invalid taglib include of ' + stringify(include) + '" found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                }
            },
            
            _isPackageInclude: function(include) {
                return include.uri ? true : false;
            },
            
            getManifest: function(include) {
                if (include.uri) {
                    return raptor.require("templating.compiler").getTaglibManifest(include.uri);
                }
                else {
                    var stringify = raptor.require('json.stringify').stringify;
                    raptor.throwError(new Error('Invalid taglib include of ' + stringify(include) + '" found in package at path "' + manifest.getPackageResource().getSystemPath() + '"'));
                }
            }
        };
    });

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

/**
 * @extension Server
 */
raptor.extend(
    "templating.compiler",
    function(raptor, compiler) {
        "use strict";
        
        var resources = raptor.require('resources'),
            strings = raptor.require('strings'),
            json = raptor.require('json'),
            packaging = raptor.require("packaging"),
            forEachEntry = raptor.forEachEntry,
            errors = raptor.errors,
            loadedTaglibs = {},
            registeredTaglibs = {},
            registerTaglib = function(uri, path, manifest) {
                if (!strings.endsWith(path, "/package.json")) {
                    path += "/package.json";
                }
                
                var registryResource = manifest.getPackageResource();
                
                registeredTaglibs[uri] = {
                        path: path,
                        manifest: manifest,
                        searchPathEntry: registryResource.getSearchPathEntry(),
                        registryPath: registryResource.getSystemPath()
                };
            },
            searchPathListenerHandler = null;
        
        packaging.enableExtension("templating.compiler");
        
        return {
            /**
             * 
             * @param path
             * @returns
             */
            compileResource: function(path) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readFully(src);
                return this.compile(src, resource.getSystemPath());
            },
            
            /**
             * 
             * @param path
             * @returns
             */
            compileAndLoadResource: function(path) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readFully(src);
                this.compileAndLoad(src, resource.getSystemPath());
            },
            
            /**
             * 
             * @returns
             */
            discoverTaglibs: function() {
                packaging.forEachTopLevelPackageManifest(function(manifest) {
                    var taglibs = manifest.taglibs;
                    if (taglibs) {
                        forEachEntry(taglibs, function(uri, path) {
                            registerTaglib(uri, path, manifest);
                        }, this);
                    }
                }, this);
                
                forEachEntry(registeredTaglibs, function(uri) {
                    this.loadTaglibPackage(uri);
                }, this);
                
                if (!searchPathListenerHandler) {
                    searchPathListenerHandler = raptor.resources.getSearchPath().subscribe("modified", function() {
                        this.discoverTaglibs(); //If the search path is modified then rediscover the 
                    }, this);
                }
            },
            
            /**
             * 
             * @param resource
             * @returns
             */
            loadTaglibPackage: function(uri) {
                if (loadedTaglibs[uri] === true) {
                    return;
                }
                loadedTaglibs[uri] = true;
                
                //console.log('Loading taglib with URI "' + uri + '"...');
                
                var taglibInfo = this._getTaglibInfo(uri);
                
                var packagePath = taglibInfo.path,
                    searchPathEntry = taglibInfo.searchPathEntry,
                    registryPath = taglibInfo.registryPath;
                
                var packageResource = resources.findResource(packagePath, searchPathEntry);
                
                if (!packageResource.exists()) {
                    errors.throwError(new Error('Taglib package not found at path "' + packagePath + '" in search path entry "' + searchPathEntry + '". This taglib was referenced in "' + registryPath + '"'));
                }
                
                packaging.loadPackage(packageResource);
            },
            
            _getTaglibInfo: function(uri) {
                var taglibInfo = registeredTaglibs[uri];
                if (!taglibInfo) {
                    errors.throwError(new Error('Unknown taglib "' + uri + '". The path to the package.json is not known.'));
                }
                return taglibInfo;
            },
            
            getTaglibManifest: function(uri) {
                return this._getTaglibInfo(uri).manifest;
            },
            
            /**
             * 
             * @param taglibXml
             * @param path
             * @returns
             */
            loadTaglibXml: function(taglibXml, path) {
                var TaglibXmlLoader = raptor.require("templating.compiler.TaglibXmlLoader");
                var taglib = TaglibXmlLoader.load(taglibXml, path);
                compiler.addTaglib(taglib);
                return taglib;
            },
            
            /**
             * 
             * @param taglibXml
             * @param path
             * @returns
             */
            compileTaglib: function(taglibXml, path) {
                var TaglibXmlLoader = raptor.require("templating.compiler.TaglibXmlLoader");
                var taglib = TaglibXmlLoader.load(taglibXml, path);
                return "$rtld(" + json.stringify(taglib) + ")";
            }
           
        };
    });
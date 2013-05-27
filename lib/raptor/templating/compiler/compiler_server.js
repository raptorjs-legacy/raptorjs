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
define.extend(
    "raptor/templating/compiler",
    function(require, compiler) {
        "use strict";
        
        var logger = require('raptor/logging').logger("raptor/templating/compiler"),
            raptor = require('raptor'),
            resources = require('raptor/resources'),
            packaging = require('raptor/packaging'),
            discoveryComplete = false,
            searchPathListenerHandler = null,
            watchingEnabled = false,
            loadedTaglibPaths = {};
        
        return {
            
            
            enableWatching: function() {
                watchingEnabled = true;
            },
            
            disableWatching: function() {
                watchingEnabled = false;
            },
            
            isWatchingEnabled: function() {
                return watchingEnabled;
            },
            
            setWatchingEnabled: function(enabled) {
                watchingEnabled = enabled;
            },
            
            /**
             * 
             * @param path
             * @returns
             */
            compileAndLoadResource: function(path, options) {
                this.createCompiler(options).compileAndLoadResource(path);
            },

            /**
             * 
             * @param path
             * @returns
             */
            compileResource: function(path, options) {
                return this.createCompiler(options).compileResource(path);
            },

            loadModuleTaglibs: function(moduleName) {
                var manifest = require('raptor/packaging').getModuleManifest(moduleName);
                if (manifest) {
                    this.loadPackageTaglibs(manifest);    
                }
            },

            loadPackageTaglibs: function(manifest) {
                var taglibs = manifest.getRaptorProp('taglibs');
                if (taglibs) {
                    raptor.forEach(taglibs, function(rtldPath) {
                        var key = manifest.getURL() + ':' + rtldPath;
                        if (!loadedTaglibPaths[key]) {
                            loadedTaglibPaths[key] = true;
                            
                            var rtldResource = manifest.resolveResource(rtldPath);
                            if (!rtldResource || !rtldResource.exists()) {
                                throw raptor.createError(new Error('Raptor TLD "' + rtldPath + '" not found for manifest "' + manifest.getURL() + '"'));
                            }
                            this.loadTaglib(rtldResource);    
                        }
                    }, this);
                }
            },
            
            findAndLoadTaglib: function(uri) {

                var pathBuilders = [
                    function(uri) {
                        var path = uri;
                        if (!path.endsWith('.rtld')) {
                            path += '.rtld';
                        }

                        if (!path.startsWith('/')) {
                            path = '/' + path;
                        }
                        return path;
                    },
                    function(uri) {
                        var lastSlash = uri.lastIndexOf('/');
                        var shortName = lastSlash === -1 ? uri : uri.substring(lastSlash+1);
                        path = uri + '/' + shortName;
                        if (!path.endsWith('.rtld')) {
                            path += '.rtld';
                        }

                        if (!path.startsWith('/')) {
                            path = '/' + path;
                        }
                        return path;
                    }
                ];

                for (var i=0, len=pathBuilders.length; i<len; i++) {
                    var pathBuilder = pathBuilders[i];
                    var path = pathBuilder(uri);
                    
                    var taglibResource = require('raptor/resources').findResource(path);
                    if (taglibResource && taglibResource.exists()) {
                        var taglib = require('raptor/templating/compiler').loadTaglib(taglibResource);
                        this.addTaglibAlias(taglib.uri, uri);
                        
                        return;
                    }
                }

                // Last resort: see if the URI is associated with a module that registers
                // the taglibs...
                require('raptor/templating/compiler').loadModuleTaglibs(uri);
            },
            
            /**
             * 
             * @returns
             */
            discoverTaglibs: function(force) {
                if (discoveryComplete && force !== true) {
                    return;
                }
                discoveryComplete = true;
                this.clearTaglibs();
                loadedTaglibPaths = {};
                
                packaging.forEachTopLevelPackageManifest(this.loadPackageTaglibs, this);
                
                resources.forEach("/rtlds", function(rtldsResource) {
                    if (rtldsResource.isDirectory()) {
                        rtldsResource.forEachChild(function(rtldResource) {
                            if (rtldResource.isFile() && rtldResource.getName().endsWith(".rtld")) {
                                this.loadTaglib(rtldResource); 
                            }
                        }, this);
                    }
                }, this);

                if (!searchPathListenerHandler) {
                    searchPathListenerHandler = require('raptor/resources').getSearchPath().subscribe("modified", function() {
                        discoveryComplete = false;
                        this.discoverTaglibs(); //If the search path is modified then rediscover the taglibs
                    }, this);
                }
            },
            
            loadTaglib: function(taglibResource) {
                var xml = taglibResource.readAsString();
                return this.loadTaglibXml(xml, taglibResource);
            },

            setWorkDir: function(workDir) {
                this.workDir = workDir;
            }
           
        };
    });
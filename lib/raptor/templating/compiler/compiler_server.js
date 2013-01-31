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
                this.createCompiler(options).compileResource(path);
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
                
                packaging.forEachTopLevelPackageManifest(function(manifest) {
                    var taglibs = manifest.getRaptorProp('taglibs');
                    if (taglibs) {
                        raptor.forEach(taglibs, function(rtldPath) {
                            var key = manifest.getURL() + ':' + rtldPath;
                            if (!loadedTaglibPaths[key]) {
                                loadedTaglibPaths[key] = true;
                                
                                var rtldResource = manifest.resolveResource(rtldPath),
                                    taglibXml = rtldResource.readAsString();
                            
                                this.loadTaglibXml(taglibXml, rtldResource.getURL());    
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

            setWorkDir: function(workDir) {
                compiler.defaultOptions.workDir = workDir;
            }
           
        };
    });
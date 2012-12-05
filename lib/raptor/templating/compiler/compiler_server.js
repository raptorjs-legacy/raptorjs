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
            /**
             * 
             * @param path
             * @returns
             */
            compileResource: function(path, options) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    throw raptor.createError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readAsString();
                return this.compile(src, resource.getSystemPath(), options);
            },
            
            enableWatching: function() {
                watchingEnabled = true;
            },
            
            disableWatching: function() {
                watchingEnabled = false;
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
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    throw raptor.createError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                
                this.compileAndLoad(resource.readAsString(), resource, options);
                
                if (watchingEnabled) {
                    resource.watch( 
                        function() {
                            console.log('Template modified at path "' + resource.getSystemPath() + '". Reloading template...');
                            try
                            {
                                this.compileAndLoad(resource.readAsString(), resource.getSystemPath(), options);    
                            }
                            catch(e) {
                                logger.warn('Unable to re-compile modified template at path "' + resource.getSystemPath() + '". Exception: ' + e, e);
                            }
                        },
                        this);
                }
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
                
                packaging.forEachTopLevelPackageManifest(function(manifest) {
                    var taglibs = manifest.getRaptorProp('taglibs');
                    if (taglibs) {
                        raptor.forEach(taglibs, function(rtldPath) {
                            var key = manifest.getSystemPath() + ':' + rtldPath;
                            if (!loadedTaglibPaths[key]) {
                                loadedTaglibPaths[key] = true;
                                
                                var rtldResource = manifest.resolveResource(rtldPath),
                                    taglibXml = rtldResource.readAsString();
                            
                                this.loadTaglibXml(taglibXml, rtldResource.getSystemPath());    
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
            }
           
        };
    });
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

$rload(function(raptor) {
    "use strict";
    
    raptor.defineClass('resources.SearchPath', function(raptor) {
    
        var forEach = raptor.forEach,
            listeners = raptor.listeners,
            DirSearchPathEntry = raptor.require('resources.DirSearchPathEntry');
        
        var SearchPath = function() {
            this.entries = [];
            listeners.makeObservable(this, SearchPath.prototype, ['modified'], false);
        };
        
        SearchPath.prototype = {
            clone: function() {
                var clone = new SearchPath();
                clone.entries = this.entries.concat([]);
                return clone;
            },
            
            addEntry: function(entry) {
                this.entries.push(entry);
                
                var packageJsonResource = entry.findResource("/package.json");
                if (packageJsonResource != null && packageJsonResource.exists()) {
                    var packager = raptor.packager;
                    var packageManifest = packager.getPackageManifest(packageJsonResource);
                    var packageSearchPath = packageManifest['raptor-search-path'];
                    if (packageSearchPath != null) {
                        raptor.forEach(packageSearchPath, function(searchPathConfig) {
                            if (searchPathConfig.dir) {
                                if (entry instanceof DirSearchPathEntry) {
                                    var dir = raptor.files.joinPaths(entry.dir, searchPathConfig.dir);
                                    this.entries.push(new DirSearchPathEntry(dir));    
                                }
                                else {
                                    throw raptor.createError(new Error("Unsupported search path entry for library: " + JSON.stringify(searchPathConfig)));
                                }
                            }
                        }, this);
                    }
                }
                
                this.publish('modified');
            },

            addDir: function(path) {
                this.addEntry(new DirSearchPathEntry(path));
            },
            
            hasDir: function(path) {
                for (var i=0, len=this.entries.length, entry; i<len; i++) {
                    entry = this.entries[i];
                    if (entry instanceof DirSearchPathEntry && entry.getDir() == path) {
                        return true;
                    }
                }
                return false;
            },
            
            forEachEntry: function(callback, thisObj) {
                var a = this.entries;
                
                for (var i=0, len=a.length; i<len; i++) {
                    if (callback.call(thisObj, a[i], i, a) === false) {
                        return;
                    }
                }
            }
        };
        
        return SearchPath;
    });
});
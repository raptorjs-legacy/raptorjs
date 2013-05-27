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


    
define.Class('raptor/resources/SearchPath', ['raptor'], function(raptor, require) {
    "use strict";
    
    var forEach = raptor.forEach,
        listeners = require('raptor/listeners'),
        DirSearchPathEntry = require('raptor/resources/DirSearchPathEntry');
    
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
                var packaging = require('raptor/packaging');
                var packageManifest = packaging.getPackageManifest(packageJsonResource);
                require('raptor/resources').addSearchPathsFromManifest(packageManifest);
            }
            
            this.publish('modified');
        },

        addDir: function(path) {
            if (path instanceof require('raptor/files/File')) {
                path = path.getAbsolutePath();
            }
            var entry = new DirSearchPathEntry(path);
            this.addEntry(entry);
            return entry;
        },
        
        removeEntry: function(entryToRemove) {
            this.entries = this.entries.filter(function(entry) {
                return entry !== entryToRemove;
            });
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
        },

        toString: function() {
            return '[' + this.entries.join(', ') + ']';
        }
    };
    
    return SearchPath;
});

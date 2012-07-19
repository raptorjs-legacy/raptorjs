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
    
    var forEach = raptor.forEach,
        errors = raptor.errors,
        logger = raptor.logging.logger('resources'),
        DirSearchPathEntry = raptor.require('resources.DirSearchPathEntry'),
        Resource = raptor.require('resources.Resource'),
        MissingResource = raptor.require('resources.MissingResource'),
        FileResource = raptor.require('resources.FileResource'),
        SearchPath = raptor.require('resources.SearchPath'),
        searchPath = new SearchPath(),
        config = raptor.getModuleConfig('resources'),
        _createDirSearchPathEntry = function(config) {
            var entry = new DirSearchPathEntry(config.path);
            return entry;
        },
        _addSearchPathEntry = function(config) {
            logger.debug('Adding search path entry (' + config.type + ": " + config.path + ')');
            if (config.type == 'dir')
            {
                searchPath.addEntry(_createDirSearchPathEntry(config));
            }
            else
            {
                errors.throwError(new Error('Invalid search path type: ' + config.type));
            }
        };

    raptor.defineCore('resources', {
        /**
         * @field
         * @type config-Config
         */
        config: raptor.config.create({
            "searchPath": {
                value: null,
                onChange: function(value) {
                    searchPath = new SearchPath();

                    forEach(value, function(config) {
                        _addSearchPathEntry(config);
                    });
                }
            }
        }),

        /**
         * @type resources-FileResource
         */
        FileResource: FileResource,
        
        createFileResource: function(path) {
            return new FileResource(null, path, path);
        },
        
        /**
         * 
         * @param searchPathEntry
         */
        addSearchPathEntry: function(searchPathEntry) {
            searchPath.addEntry(searchPathEntry);
        },
        
        /**
         * 
         * @param path
         */
        addSearchPathDir: function(path) {
            _addSearchPathEntry({
                type: 'dir',
                path: path
            });
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        findResource: function(path, searchPathEntry) {
            
            if (path instanceof Resource) {
                return path;
            }
            
            if (path.constructor !== String)
            {
                raptor.errors.throwError(new Error("Invalid path: " + path));
            }
            
            var resource = null;
            
            if (searchPathEntry) {
                resource = searchPathEntry.findResource(path);
            }
            else {
                searchPath.forEachEntry(function(entry) {
                    resource = entry.findResource(path);
                    if (resource != null) {
                        return false;
                    }
                }, this);
            }
            
            return resource || new MissingResource(path);
        },
        
        /**
         * Finds all resources with the provided path by searching for the 
         * resource in all search path entries and invoking the provided
         * callback for each found resource.
         * 
         * @param path
         * @param callback
         * @param thisObj
         */
        forEach: function(path, callback, thisObj) {
            searchPath.forEachEntry(function(entry) {
                var resource = entry.findResource(path);
                if (resource != null) {
                    callback.call(thisObj, resource);
                }
            }, this);
        },
        
        /**
         */
        toString: function() {
            return '[resources: searchPath=' + JSON.stringify(searchPath.entries) + ']';
        },
        
        getSearchPath: function() {
            return searchPath;
        },
        
        getSearchPathString: function() {
            var parts = [];
            searchPath.forEachEntry(function(entry) {
                parts.push(entry.toString());
            });
            return parts.length > 0 ? parts.join('\n') : "(empty)";
        },
        
        joinPaths: function(p1, p2) {
            if (!p2) return p1;
            if (!p1) return p2;
            
            var strings = raptor.require('strings');
            if (p1.endsWith('/') && p2.startsWith('/')) {
                //Example: p1="/begin/", p2="/end" 
                p2 = p2.substring(1);
            }
            else if (!p1.endsWith('/') && !p2.startsWith('/')) {
                //Example: p1="/begin", p2="end" 
                return p1 + '/' + p2;
            }
            //Example: p1="/begin", p2="/end" 
            return p1 + p2;
        },
        
        isResourceInstance: function(o) {
            return o instanceof Resource;
        },
        
        /**
         * Resolves a possibly path relative to a directory to an absolute path.
         */
        resolvePath: function(dirPath, relativePath) {
            
            var paths = raptor.require('paths');
            return paths.resolve(dirPath, relativePath);
        }
    });    
    
    raptor.resources.config.set("searchPath", config.searchPath);
});
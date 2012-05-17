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
    raptor.defineClass('resources.Resource', function(raptor) {
    
        return {
            /**
             * 
             * @param path
             * @returns {void}
             */
            init: function(searchPathEntry, path) {
                this.setSearchPathEntry(searchPathEntry);
                this.setPath(path);
            },
            
            /**
             * 
             * @param {String} path
             * @returns {void}
             */
            setPath: function(path) {
                this.path = path;
            },
            
            /**
             * Returns the path to the resource.
             * 
             * A path is always normalized so that it uses forward slashes as part
             * separators and it will always being with a forward slash.
             * 
             * @returns {String} The path for the resource
             */
            getPath: function() {
                return this.path;
            },
            
            /**
             * 
             * @returns {Boolean} Returns true if the resource is of type resources.FileResource, false otherwise
             */
            isFileResource: function() {
                return false;
            },
            
            /**
             * 
             * @returns {String} The name of the resource
             */
            getName: function() {
                if (this._name == null)
                {
                    this._name = this.path.substring(this.path.lastIndexOf('/') + 1);
                }
                return this._name;                
            },
            
            /**
             * 
             * @returns
             */
            getSystemPath: function() {
                raptor.errors.throwError(new Error('Not Implemented'));
            },
            
            /**
             * 
             * @returns
             */
            readFully: function() {
                raptor.errors.throwError(new Error('Not Implemented'));
            },
            
            /**
             */
            toString: function() {
                return '[' + this.getClass().getName() + ': path=' + this.getPath() + ', systemPath=' + this.getSystemPath() + ']';
            },
            
            /**
             * 
             * @returns
             */
            exists: function() {
                return true;
            },
            
            /**
             * 
             * @param childPath
             * @returns
             */
            findChild: function(childPath) {
                var resources = raptor.resources;
                
                return resources.findResource(
                        resources.joinPaths(this.getPath(), childPath));
            },
            
            /**
             * 
             * @param searchPathEntry
             * @returns
             */
            setSearchPathEntry: function(searchPathEntry) {
                this.searchPathEntry = searchPathEntry;
            },
            
            /**
             * 
             * @returns
             */
            getSearchPathEntry: function() {
                return this.searchPathEntry;
            }
            
            
        
        };
    });
});
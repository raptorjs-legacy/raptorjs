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
    
    raptor.defineClass(
        'resources.DirSearchPathEntry',
        {
            superclass: 'resources.SearchPathEntry'
        },
        function() {
    
            var files = raptor.require('files'),
                FileResource = raptor.require('resources.FileResource'),
                logger = raptor.logging.logger('resources.DirSearchPathEntry');
    
            return {
                /**
                 * 
                 * @param dir
                 * @returns
                 */
                init: function(dir) {
                    this.dir = dir;
                },
            
                /**
                 * 
                 * @param path
                 * @returns
                 */
                findResource: function(path) {
                    var fullPath = files.joinPaths(this.dir, path),
                        fileResource;
                    
                    if (files.exists(fullPath)) {
                        logger.debug('Resource "' + path + '" EXISTS in directory "' + this.dir + '"');
                        fileResource = new FileResource(this, path, fullPath);
                        return fileResource;
                    }
                    else
                    {
                        logger.debug('Resource "' + path + '" does not exist in directory "' + this.dir + '"');
                    }
                    return null;
                },
                
                /**
                 */
                toString: function() {
                    return '[DirSearchPathEntry: ' + this.dir + ']';
                }
            };
        });

});
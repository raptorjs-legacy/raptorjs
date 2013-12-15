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

define.Class(
    'raptor/resources/DirSearchPathEntry',
    'raptor/resources/SearchPathEntry',
    function(require, exports, module) {
        'use strict';
        
        var files = require('raptor/files'),
            FileResource = require('raptor/resources/FileResource'),
            logger = module.logger();

        return {
            /**
             * 
             * @param dir
             * @returns
             */
            init: function(dir) {
                this.dir = dir;
            },
            
            getDir: function() {
                return this.dir;
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
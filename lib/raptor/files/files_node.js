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
 * @extension Node
 */
define.extend(
    'raptor/files',
    function(require, exports, module) {
        "use strict";
        
        var nodePath = require('path'), 
            nodeFs = require('fs'),
            File = require('raptor/files/File'),
            statSync = function(path) {
                return nodeFs.statSync(path);
            };

        return {
            /**
             * 
             * @param path
             * @returns
             */
            exists: function(path) {
                return nodeFs.existsSync ? nodeFs.existsSync(path) : nodePath.existsSync(path);
            },

            normalizePath: function(path) {
                return nodePath.join.apply(nodePath, arguments);
            },
            
            /**
             * 
             * @param paths
             * @returns
             */
            joinPaths: function(paths) {
                return nodePath.join.apply(nodePath, arguments);
            },
            
            /**
             * 
             * @param path
             * @param encoding
             * @returns
             */
            readAsString: function(path, encoding) {
                var file = new File(path);
                return file.readAsString(encoding);
            },
            
            writeAsString: function(path, data, encoding) {
                var file = new File(path);
                return file.writeAsString(data, encoding);
            },
            
            readAsBinary: function(path) {
                var file = new File(path);
                return file.readAsBinary();
            },
            
            writeAsBinary: function(path, data) {
                var file = new File(path);
                return file.writeAsBinary(data);
            },

            readFully: function(path, encoding) {
                var file = new File(path);
                return file.readFully(encoding);
            },
            
            writeFully: function(path, data, encoding) {
                var file = new File(path);
                return file.writeFully(data, encoding);
            },

            /**
             * 
             */
            isDirectory: function(path) {
                return statSync(path).isDirectory();
            },
            
            /**
             * 
             * @param path
             * @returns
             */
            isFile: function(path) {
                return statSync(path).isFile();
            },
            
            /**
             * 
             * @param dirPath
             * @param callback
             * @param thisObj
             * @returns
             */
            listFilenames: function(dirPath, callback, thisObj) {
                var files = nodeFs.readdirSync(dirPath);
                return files;
            },
            
            resolvePath: function(from, to) {
                if (!from) {
                    return to;
                }
                
                return nodePath.resolve.apply(nodePath, arguments);
            }
        };
    });
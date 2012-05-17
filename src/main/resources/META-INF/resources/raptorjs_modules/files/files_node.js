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
    
    var nodePath = require('path'), 
        nodeFs = require('fs'),
        statSync = function(path) {
            return nodeFs.statSync(path);
        };
    
    /**
     * @extension Node
     */
    raptor.extendCore('files', {
        /**
         * 
         * @param path
         * @returns
         */
        exists: function(path) {
            return nodePath.existsSync(path);
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
        readFully: function(path, encoding) {
            if (encoding == null) encoding = "UTF-8";
            return nodeFs.readFileSync(path, encoding);
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
        
        writeFully: function(path, data, encoding) {
            nodeFs.writeFileSync(path, data, encoding || "UTF-8");
        }
    });

});
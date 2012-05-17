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
    
    var JavaFile = Packages.java.io.File;
    
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
            return new JavaFile(path).exists();
        },
        
        /**
         * 
         * @param paths
         * @returns
         */
        joinPaths: function(paths) {
            if (arguments.length === 2) {
                return new JavaFile(arguments[0], arguments[1]).getAbsolutePath();
            }
            else {
                raptor.errors.throwError(new Error("Not supported"));
            }
        },
        
        /**
         * 
         * @param path
         * @param encoding
         * @returns
         */
        readFully: function(path, encoding) {
            if (encoding == null) encoding = "UTF-8";
            return __rhinoHelpers.getFiles().readFully(new JavaFile(path), encoding);
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isDirectory: function(path) {
            return new JavaFile(path).isDirectory();
        },
        
        /**
         * 
         * @param path
         * @returns
         */
        isFile: function(path) {
            return new JavaFile(path).isFile();
        },
        
        /**
         * 
         * @param dirPath
         * @returns
         */
        listFilenames: function(dirPath) {
            var javaFile = new JavaFile(dirPath);
            var filenames = javaFile.list();
            return raptor.java.convertArray(filenames);
        }
    });

});
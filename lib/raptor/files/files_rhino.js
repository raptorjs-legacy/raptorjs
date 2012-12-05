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
    
    var JavaFile = Packages.java.io.File;
    
    /**
     * @extension Rhino
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
                throw raptor.createError(new Error("Not supported"));
            }
        },
        
        /**
         * 
         * @param path
         * @param encoding
         * @returns
         */
        readAsString: function(path, encoding) {
        	var file = new (this.File)(path);
            return file.readAsString(encoding);
        },
        
        writeAsString: function(path, data, encoding) {
        	var file = new (this.File)(path);
            return file.writeAsString(data, encoding);
        },
        
        readAsBinary: function(path) {
            var file = new (this.File)(path);
            return file.readAsBinary();
        },
        
        writeAsBinary: function(path, data) {
            var file = new (this.File)(path);
            return file.writeAsBinary(data);
        },

        readFully: function(path, encoding) {
            var file = new (this.File)(path);
            return file.readFully(encoding);
        },
        
        writeFully: function(path, data, encoding) {
            var file = new (this.File)(path);
            return file.writeFully(data, encoding);
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
        },
        
        resolvePath: function(from, to) {
        	if (arguments.length === 2) {
                return new JavaFile(from, to).getCanonicalPath();
            }
            else {
                throw raptor.createError(new Error("Not supported"));
            }
        }
    });

});
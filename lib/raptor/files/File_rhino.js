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
 * @extension Rhino
 */
define.Class(
    'raptor/files/File',
    ['raptor'],
    function(raptor, exports, module) {
        "use strict";

        var JavaFile = Packages.java.io.File;

        function File(path) {
            this.javaFile = null;
            
            if (arguments.length === 1) {
                if (!path) {
                    throw raptor.createError(new Error("path is required"));
                }
                this.javaFile = path instanceof JavaFile ? path : new JavaFile(path);
            }
            else if (arguments.length === 2) {
                var parent = arguments[0],                
                    child = arguments[1],
                    parentJavaFile = null;
                
                if (!parent) {
                    throw raptor.createError(new Error("parent is required"));    
                }
                
                if (!child) {
                    throw raptor.createError(new Error("child is required"));    
                }
                
                if (parent instanceof File) {
                    parentJavaFile = parent.javaFile;
                }
                else if (parent instanceof JavaFile) {
                    parentJavaFile = parent;
                }
                else {
                    parentJavaFile = new JavaFile(parent.toString());
                }
                
                this.javaFile = new JavaFile(parentJavaFile, child);
            }
            else {
                throw raptor.createError(new Error("Illegal number of arguments: " + arguments.length));
            }
        }
        
        File.prototype = {
            
            lastModified: function() {
                return this.javaFile.lastModified() + 0;
            },
            
            exists: function() {
                return this.javaFile.exists() === true;
            },
            
            isDirectory: function() {
                return this.javaFile.isDirectory() === true;
            },
            
            isFile: function() {
                return this.javaFile.isFile() === true;
            },
            
            isSymbolicLink: function() {
                var javaCanonicalFile;
                if (!this.javaFie.getParent()) {
                    javaCanonicalFile = this.javaFile;
                }
                else {
                    javaCanonicalFile = new JavaFile(
                            this.javaFile.getParentFile().getCanonicalFile(),
                            this.javaFile.getName());
                }
                
                return !javaCanonicalFile.getCanonicalFile().equals(javaCanonicalFile.getAbsoluteFile());
            },
            
            getAbsolutePath: function() {
                return '' + this.javaFile.getAbsolutePath();
            },
            
            getName: function() {
                return '' + this.javaFile.getName();
            },
            
            getCanonicalFile: function() {
                return new File(this.javaFile.getCanonicalPath());
            },

            getNameWithoutExtension: function() {
                var name = this.getName();
                var lastDot = name.lastIndexOf('.');
                return lastDot !== -1 ? name.substring(0, lastDot) : name;
            },
            
            getParent: function() {
                var parent = this.javaFile.getParent();
                return parent ? '' + parent : null;
            },
            
            getParentFile: function() {
                var parent = this.javaFile.getParent();
                return parent ? new File(parent) : null;
            },
            
            toString: function() {
                return this.getAbsolutePath();
            },
            
            listFiles: function() {
                var filenames = this.list();
                var files = new Array(filenames.length);
                
                for (var i=0, len=filenames.length; i<len; i++) {
                    files[i] = new File(new JavaFile(this.javaFile, filenames[i]));
                }
                
                return files;
            },
            
            list: function() {
                var filenames = this.javaFile.list(),
                    i=0,
                    len = filenames.length();
                
                for (; i<len; i++) {
                    filenames[i] = '' + filenames[i];
                }
                
                return filenames;
            },
            
            forEachFile: function(callback, thisObj) {
                var files = this.listFiles();
                
                for (var i=0, len=files.length; i<len; i++) {
                    callback.call(thisObj, files[i]);
                }
            },
            
            mkdir: function() {
                this.javaFile.mkdir();
            },
            
            mkdirs: function() {
                this.javaFile.mkdirs();
            },

            writeFully: function(data, encoding) {
                if (!encoding) {
                    encoding = null;
                }
                __rhinoHelpers.getFiles().writeFully(this.javaFile, data, encoding);
            },
            
            readFully: function(encoding) {
                if (!encoding) {
                    encoding = null;
                }
                var data = __rhinoHelpers.getFiles().readFully(this.javaFile, data, encoding);
                if (encoding) {
                    return '' + data;
                }
                else {
                    return data;
                }
            },
            
            writeAsString: function(str, encoding) {
                this.writeFully(str, encoding || "UTF8");
            },
            
            readAsString: function(encoding) {
                return this.readFully(encoding || "UTF8");
            },
            
            writeAsBinary: function(data) {
                this.writeFully(data, null);
            },
            
            readAsBinary: function() {
                return this.readFully(null);
            },
            
            remove: function() {
                if (!this.exists()) {
                    throw raptor.createError(new Error("Unable to delete file. File does not exist: " + this.getAbsolutePath()));
                }
                this.javaFile['delete']();
            },
            
            getExtension: function() {
                var filename = this.getName();
                var lastDot = filename.lastIndexOf('.');
                if (lastDot === 0) {
                    return "";
                }
                return lastDot === -1 ? "" : filename.substring(lastDot+1); 
            },
            
            resolveFile: function(relPath) {
                return new File(this.javaFile, relPath);
            }
        };

        raptor.extend(File.prototype, require('raptor/files/FileMixins'));

        return File;
    });
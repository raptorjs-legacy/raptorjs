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
define.Class(
    'raptor/files/File', 
    function(require, exports, module) {
        var nodePath = require("path"),
            nodeFS = require("fs"),
            existsSync = function(path) {
                return nodeFS.existsSync ? nodeFS.existsSync(path) : nodePath.existsSync(path);
            };

        function File(path) {
            if (arguments.length === 1) {
                if (!path) {
                    throw new Error("path is required");
                }
                this._path = path;    
            }
            else if (arguments.length === 2) {
                var parentFile = arguments[0],                
                    childPath = arguments[1],
                    parentPath;
                
                if (!parentFile) {
                    throw new Error("parentFile is required");
                }
                
                if (!childPath) {
                    throw new Error("childPath is required");
                }
                
                
                if (parentFile instanceof File) {
                    parentPath = parentFile.getAbsolutePath();
                }
                else {
                    parentPath = '' + parentFile;
                }
                
                this._path = nodePath.join(parentPath, childPath);
            }
            
            this._stat = null;
        };
        
        File.prototype = {
            _getStat: function() {
                try
                {
                    return nodeFS.lstatSync(this._path);
                }
                catch(e) {
                    return null;
                }
            },
            
            lastModified: function() {
                return this._getStat().mtime.getTime();
            },
            
            exists: function() {
                return existsSync(this._path);
            },
            
            isDirectory: function() {
                if (this.isSymbolicLink()) {
                    return this.readSymbolicLink().isDirectory();
                }

                var stat = this._getStat();
                return stat && stat.isDirectory();
            },
            
            isFile: function() {
                var stat = this._getStat();
                return stat && stat.isFile();
            },
            
            isSymbolicLink: function() {
                var stat = this._getStat();
                return stat && stat.isSymbolicLink();
            },
            
            getAbsolutePath: function() {
                return this._path;
            },
            
            getName: function() {
                return nodePath.basename(this._path);
            },
            
            getCanonicalFile: function() {
                
                if (this.isSymbolicLink()) {
                    return this.readSymbolicLink().getCanonicalFile();
                }
                else {
                    return this;
                }
            },

            getNameWithoutExtension: function() {
                var name = this.getName();
                var lastDot = name.lastIndexOf('.');
                return lastDot !== -1 ? name.substring(0, lastDot) : name;
            },
            
            getParent: function() {
                return nodePath.dirname(this._path);
            },
            
            getParentFile: function() {
                var parentPath = nodePath.dirname(this._path);
                
                return parentPath ? new File(parentPath) : null;
            },
            
            toString: function() {
                return this.getAbsolutePath();
            },
            
            readSymbolicLink: function() {
                var linkPath = nodeFS.readlinkSync(this._path);
                var path = nodePath.resolve(this.getParent(), linkPath);
                return new File(path);
            },
            
            listFiles: function() {
                var filenames = this.list();
                var files = new Array(filenames.length);
                
                for (var i=0, len=filenames.length; i<len; i++) {
                    files[i] = new File(nodePath.join(this._path, filenames[i]));
                }
                
                return files;
            },
            
            list: function() {
                var path = this._path;
                
                if (!existsSync(path)) {
                    throw new Error("File does not exist: " + path);
                }
                
                
                if (this.isSymbolicLink()) {
                    return this.readSymbolicLink().list();
                }
                
                var filenames = nodeFS.readdirSync(this._path);
                return filenames;
            },
            
            forEachFile: function(callback, thisObj) {
                var files = this.listFiles();
                
                for (var i=0, len=files.length; i<len; i++) {
                    callback.call(thisObj, files[i]);
                }
            },
            
            mkdir: function() {
                nodeFS.mkdirSync(this.getAbsolutePath());
            },
            
            mkdirs: function() {
                var missing = [],
                    dir = this;
                
                while ((dir = dir.getParentFile())) {
                    if (dir.exists()) {
                        break;
                    }
                    else {
                        missing.push(dir);
                    }
                }
                
                for (var i=missing.length-1; i>=0; i--) {
                    missing[i].mkdir();
                }
            },

            writeFully: function(str, encoding) {
                if (this.isSymbolicLink()) {
                    this.readSymbolicLink().writeFully(str, encoding);
                    return;
                }
                
                this.mkdirs();
                
                nodeFS.writeFileSync(this.getAbsolutePath(), str, encoding );
            },
            
            readFully: function(encoding) {
                if (this.isSymbolicLink()) {
                    this.readSymbolicLink().readFully(encoding);
                    return;
                }
                
                return nodeFS.readFileSync(this.getAbsolutePath(), encoding);
            },
            
            writeAsString: function(str, encoding) {
                return this.writeFully(str, encoding || "UTF-8");
            },
            
            readAsString: function(encoding) {
                return this.readFully(encoding || "UTF-8");
            },
            
            writeAsBinary: function(data) {
                return this.writeFully(data, null);
            },
            
            readAsBinary: function() {
                return this.readFully(null);
            },
            
            remove: function() {
                if (!this.exists()) {
                    throw new Error("Unable to delete file. File does not exist: " + this.getAbsolutePath());
                }
                if (this.isSymbolicLink()) {
                    nodeFS.unlinkSync(this.getAbsolutePath());
                }
                else if (this.isDirectory()) {
                    //Delete all children
                    this.forEachFile(function(child) {
                        child.remove();
                    }, this);
                    
                    nodeFS.rmdirSync(this.getAbsolutePath());
                }
                else if (this.isFile()) {
                    nodeFS.unlinkSync(this.getAbsolutePath());
                }
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
                var from = this.isDirectory() ? this : this.getParentFile();
                return new File(nodePath.resolve(from.getAbsolutePath(), relPath));
            }
        };

        return File;
    });
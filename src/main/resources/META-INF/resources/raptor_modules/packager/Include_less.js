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

raptor.defineClass(
    "packager.Include_less",
    "packager.Include",
    function(raptor) {
        "use strict";
        
        var createLessImporter = function(include, context) {
                var Parser = require('less').Parser;
                
                
                
                return function (path, paths, callback, env) {
                    var lessSrc,
                        foundPath,
                        resource;
                    
                    resource = include.resolveResource(path, context);
                    if (resource.exists()) {
                        foundPath = resource.getSystemPath();
                        lessSrc = resource.readFully();
                    }
                   
                    if (foundPath) {
                        
                        try
                        {
                                
                            new Parser({
                                    paths: paths,
                                    filename: foundPath
                                }).parse(lessSrc, function (e, root) {
                                    callback(e, root, lessSrc);
                                });
                        }
                        catch(e) {
                            callback(e);
                        }
                    } else {
                        if (typeof(env.errback) === "function") {
                            env.errback(path, paths, callback);
                        } else {
                            callback({ type: 'File', message: "'" + path + "' wasn't found.\n" });
                        }
                    }
                };
            }; //End createLessImporter
        
        return {
            getKey: function() {
                return "less:" + this.resolvePathKey(this.path);
            },
            
            toString: function(include) {
                return this.getResource().getPath();
            },
            
            getContentType: function() {
                return "text/css";
            },
            
                        
            getResourcePath: function() {
                return this.path;
            },
            
            getCode: function(context) {
                var Parser = require('less').Parser;
                
                var resource = this.getResource(context);
                var lessSource = resource.readFully();

                
                var result,
                    oldImporter = Parser.importer;

                
                try
                {
                    Parser.importer = createLessImporter(this, context);
                    
                    var parser = new Parser({
                        paths: ['.'],  // search paths for @import directives
                        filename: resource.getSystemPath()
                    });
                    
                    if (this.imports) {
                        var importsSource = this.imports.map(function(importPath) {
                            return '@import "' + importPath + '";\n';
                        }).join("");
                        lessSource = importsSource + lessSource;
                    }

                    parser.parse(lessSource, function (e, root) {
                        if (e) {
                            raptor.throwError(new Error('Unable to parse Less file at path "' + resource.getSystemPath() + '". Exception: ' + e.message));
                        } else {
                            try {
                                result = root.toCSS();    
                            }
                            catch(e) {
                                raptor.throwError(new Error('Unable to generate CSS code for Less file at path "' + resource.getSystemPath() + '". Exception: ' + e.message));    
                            }
                        }
                    });
                }
                catch(e) {
                    raptor.throwError(new Error('Unable to parse Less file at path "' + resource.getSystemPath() + '". Exception: ' + e.message));
                }
                finally {
                    Parser.importer = oldImporter;
                }
                
                return result;
            },
            
            isCompiled: function() {
                return true;
            }
        };
    });

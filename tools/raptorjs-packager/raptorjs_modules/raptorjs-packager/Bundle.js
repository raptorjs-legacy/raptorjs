raptor.defineClass(
    "raptorjs-packager.Bundle",
    function(raptor) {
        var packaging = raptor.require('packaging'),
            files = raptor.require('files'),
            forEach = raptor.forEach,
            forEachEntry = raptor.forEachEntry,
            indent = function(level) {
                var str = "";
                for (var i=0; i<level; i++) {
                    str += " ";
                }
                return str;
            },
            leftPad = function(str, len) {
                while (str.length < len) {
                    str = " " + str;
                }
                return str;
            },
            crypto = require('crypto');
        
        var Bundle = function(bundleConfig, name) {
            this.options = bundleConfig.options;
            this.enabledExtensions = bundleConfig.enabledExtensions;
            this.bundleConfig = bundleConfig;
            this.name = name;
            
            this.includes = [];
            this.codeByContentType = {};
        };
        
        Bundle.prototype = {
            addInclude: function(include, manifest, recursive) {
                
                var _addInclude = function(include, manifest, forcePackage, depth) {
                    
                    
                    var handler = packaging.getIncludeHandler(include.type);
                    
                    var existingBundle = this.bundleConfig.getBundleForInclude(include, manifest);
                    if (existingBundle) {
                        return; //The include is already part of another bundle
                    }
                    
                    if (handler.isPackageInclude(include)) {
                        
                        if (include.recursive) {
                            recursive = true;
                        }
                        
                        if (recursive === true) {
                            this.bundleConfig.setBundleForInclude(include, manifest, this);
                        }
                        
                        var dependencyManifest = handler.getManifest(include);
                        
                        if (recursive === true || forcePackage === true) {
                            this.logger().info(leftPad(this.name, 30) + ": " + indent(depth) + 'Adding includes for package "' + dependencyManifest.getPath() + '"');
                            
                            
                            
                            dependencyManifest.forEachInclude({
                                callback: function(type, packageInclude) {
                                    _addInclude.call(this, packageInclude, dependencyManifest, false, depth+1);
                                },
                                enabledExtensions: this.enabledExtensions,
                                thisObj: this
                            });
                        }
                        else {
                            this.logger().info(leftPad(this.name, 30) + ": " + indent(depth) + "***Skipping nested package " + dependencyManifest.getPath() + ' for package "' + manifest.getPath() + '"');
                        }
                    }
                    else {
                        
                        
                        this.bundleConfig.setBundleForInclude(include, manifest, this);
                        
                        this.logger().info(leftPad(this.name, 30) + ": " + indent(depth) + "Adding include " + JSON.stringify(include) + ' to bundle "' + this.name + '"');
                        
                        var aggregateFunc = handler.aggregate;
                        if (!aggregateFunc) {
                            raptor.errors.throwError(new Error('"aggregate" function not found for include handler of type "' + include.type + '". Include: ' + JSON.stringify(include)));
                        }
                        aggregateFunc.call(handler, include, manifest, this);
                        
                        this.includes.push(include);
                    }
                };
                
                _addInclude.call(this, include, manifest, true, 0);
            },
            
            addStyleSheetCode: function(css, path) {
                this.addCode('css', css, path);
            },

            addJavaScriptCode: function(js, path) {
                this.addCode('js', js, path);
            },

            addCode: function(contentType, code, path) {
                var contentTypeCode = this.codeByContentType[contentType];
                if (!contentTypeCode) {
                    contentTypeCode = this.codeByContentType[contentType] = [];
                }
                contentTypeCode.push({code: code, path: path});
            },
            
            addResourceCode: function(contentType, resource) {
                this.addCode(contentType, resource.readFully(), resource.getSystemPath());
            },
            
            forEachCode: function(contentType, callback, thisObj) {
                var contentTypeCode = this.codeByContentType[contentType];
                if (!contentTypeCode) {
                    return;
                }
                
                forEach(contentTypeCode, callback, thisObj);
            },
            
            getContentTypes: function() {
                return raptor.keys(this.codeByContentType);
            },
            
            hasCode: function(contentType) {
                var contentTypeCode = this.codeByContentType[contentType];
                return contentTypeCode && contentTypeCode.length;
            },
            
            writeBundle: function(dir, options) {
                var outputFile;
                if (!options) {
                    options = {};
                }
                
                forEachEntry(this.codeByContentType, function(contentType, contentArray) {
                    if (contentArray.length) {
                        var useChecksums = this.options.useChecksums !== false;
                        
                        var shasum = useChecksums ? crypto.createHash('sha1') : null;
                        
                        
                        var size = 0;
                        
                        var output = [];
                        forEach(contentArray, function(content) {
                            var code = content.code;
                            if (options.minify !== false) {
                                code = raptor.require("js-minifier").minify(code);
                            }
                            
                            size += code.length;
                            output.push("//" + content.path);
                            output.push(code);
                        }, this);
                        
                        output = output.join("\n");
                        
                        if (useChecksums) {
                            shasum.update(output);
                            this.checksum = shasum.digest('hex').substring(0, 8);
                        }
                        
                        if (this.options.addBundleUrls !== false) {
                            output += '\n$rurl("' + this.getUrl(contentType) + '");';    
                        }
                        
                        
                        var filename = this.getFilename(contentType, options);
                        outputFile = new files.File(dir, filename);
                        outputFile.writeFully(output);
                        this.logger().info('Bundle "' + this.name + '" written to "' + outputFile.getAbsolutePath() + ". (size: " + size + " bytes)");
                    }
                }, this);                
            },
            
            getFilename: function(contentType, options) {
                if (this.checksum) {
                    return this.name + "-" + this.checksum + "." + contentType;    
                }
                else {
                    return this.name + "." + contentType;
                }
                
            },
            
            getUrl: function(contentType, options) {
                return this.getFilename(contentType, options);
            }
        };
        
        return Bundle;
    });
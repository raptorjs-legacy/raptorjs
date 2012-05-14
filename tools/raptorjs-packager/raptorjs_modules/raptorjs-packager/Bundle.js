raptor.defineClass(
    "raptorjs-packager.Bundle",
    function(raptor) {
        var packaging = raptor.require('packaging'),
            files = raptor.require('files'),
            forEach = raptor.forEach,
            forEachEntry = raptor.forEachEntry;
        
        var Bundle = function(bundleConfig, name) {
            this.bundleConfig = bundleConfig;
            this.name = name;
            
            this.includes = [];
            this.codeByContentType = {};
        };
        
        Bundle.prototype = {
            addInclude: function(include, manifest) {
                
                var existingBundle = this.bundleConfig.getBundleForInclude(include);
                if (existingBundle) {
                    return; //The include is already part of another bundle
                }
                
                this.bundleConfig.setBundleForInclude(include, this);
                
                var handler = packaging.getIncludeHandler(include.type);
                
                if (handler.isPackageInclude(include)) {
                    var manifest = handler.getManifest(include);
                    
                    manifest.forEachInclude({
                        callback: function(type, packageInclude) {
                            this.addInclude(packageInclude, manifest);
                        },
                        enabledExtensions: this.enabledExtensions,
                        thisObj: this
                    });
                }
                else {
                    var aggregateFunc = handler.aggregate;
                    if (!aggregateFunc) {
                        raptor.errors.throwError(new Error('"aggregate" function not found for include handler of type "' + include.type + '". Include: ' + JSON.stringify(include)));
                    }
                    aggregateFunc.call(handler, include, manifest, this);
                    
                    this.includes.push(include);
                }
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
                
                forEachEntry(this.codeByContentType, function(contentType, contentArray) {
                    if (contentArray.length) {
                        outputFile = new files.File(dir, this.getFilename(contentType, options));
                        
                        var output = [];
                        forEach(contentArray, function(content) {
                            output.push("//" + content.path);
                            output.push(content.code);
                        }, this);
                        
                        outputFile.writeFully(output.join("\n"));
                    }
                }, this);                
            },
            
            getFilename: function(contentType, options) {
                return this.name + "." + contentType;
            }
        };
        
        return Bundle;
    });
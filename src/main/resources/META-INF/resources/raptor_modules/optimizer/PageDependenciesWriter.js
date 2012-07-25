raptor.defineClass(
    "optimizer.PageDependenciesWriter",
    function(raptor) {
        "use strict";
        
        var crypto = require('crypto'),
            forEach = raptor.forEach;
        
        var PageDependenciesWriter = function(config) {
            this.checksumLength = 8;
            this.urlBuilder = null;
            this.context = {};
            
            raptor.extend(this, config);
            
            if (!this.filters) {
                this.filters = [];
            }
            
            if (!this.context) {
                this.context = {};
            }
        };
        
        PageDependenciesWriter.prototype = {
            addFilter: function(filter) {
                this.filters.push(filter);
            },
            
            writePageDependencies: function(pageDependencies) {
                var loaderMetadata = {};
                
                if (!this.context) {
                    this.context = {};
                }
                
                this.context.loaderMetadata = null;
                
                var _this = this,
                    bundleChecksums = {},
                    writtenFiles = {},
                    context = this.context,
                    writeBundle = function(bundle) {
                        if (bundle.inPlaceDeployment === true) {
                            return;
                        }
                        
                        var checksum = bundleChecksums[bundle.getKey()];
                            
                        if (!checksum) {
                            var bundleData = _this.readBundle(bundle, context);
                            bundleChecksums[bundle.getKey()] = checksum = bundleData.checksum;
                            _this.writeBundle(bundle, bundleData.code, checksum);    
                        }
                        
                        return checksum;
                    },
                    htmlByLocation = {},
                    addHtml = function(location, html) {
                        var htmlForLocation = htmlByLocation[location];
                        if (!htmlForLocation) {
                            htmlForLocation = htmlByLocation[location] = [];
                        }
                        htmlForLocation.push(html);
                    };
                
                
                if (pageDependencies.hasAsyncRequires()) {
                    context.loaderMetadata = loaderMetadata = {};
                    
                    pageDependencies.forEachAsyncRequire(function(asyncRequire) {
                        var entry = loaderMetadata[asyncRequire.getName()] = {
                            requires: [],
                            css: [],
                            js: []
                        };
                        
                        forEach(asyncRequire.getRequires(), function(require) {
                            entry.requires.push(require);
                            
                        }, this);
                        
                        forEach(asyncRequire.getBundles(), function(bundle) {
                            var checksum = writeBundle(bundle);
                            if (bundle.isJavaScript()) {
                                entry.js.push(this.getBundleUrl(bundle, checksum));
                            }
                            else if (bundle.isStyleSheet()) {
                                entry.css.push(this.getBundleUrl(bundle, checksum));
                            }
                            else {
                                raptor.throwError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                            }
                            
                        }, this);
                        
                        if (!entry.requires.length) {
                            delete entry.requires;
                        }
                        
                        if (!entry.js.length) {
                            delete entry.js;
                        }
                        
                        if (!entry.css.length) {
                            delete entry.css;
                        }
                    }, this);
                }
                
                
                pageDependencies.forEachPageBundle(function(bundle) {
                    var checksum = writeBundle(bundle);
                    if (bundle.isInline()) {
                        raptor.throwError(new Error("Inline bundles not yet supported"));
                    }
                    else {
                        addHtml(bundle.getLocation(), this.getBundleIncludeHtml(bundle, checksum));
                    }
                }, this);
                
                raptor.forEachEntry(htmlByLocation, function(location, html) {
                    htmlByLocation[location] = html.join('\n');
                }, this);
                
                return htmlByLocation;
            },
            getBundleIncludeHtml: function(bundle, checksum) {
                var url = this.getBundleUrl(bundle, checksum);
                if (bundle.isJavaScript()) {
                    return '<script type="text/javascript" src="' + url + '"></script>';
                }
                else if (bundle.isStyleSheet()) {
                    return '<link rel="stylesheet" type="text/css" href="' + url + '" />';
                }
                else {
                    raptor.throwError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                }
            },
            
            getBundleUrl: function(bundle, checksum) {
                var urlBuilder = this.getUrlBuilder();
                if (!urlBuilder) {
                    raptor.throwError(new Error("URL builder not set."));
                }
                return urlBuilder.buildBundleUrl(bundle, checksum);
            },
            
            applyFilter: function(code, contentType, include, bundle) {
    
                forEach(this.filters, function(filter) {
                    var output,
                        filterFunc,
                        filterThisObj;
                    
                    if (typeof filter === 'function') {
                        filterFunc = filter;
                    }
                    else if (typeof filter === 'string') {
                        filter = raptor.require(filter);
                        if (typeof filter === 'function') {
                            var FilterClass = filter;
                            filter = new FilterClass();
                        }
                        filterFunc = filter.filter;
                        filterThisObj = filter;
                    }
                    else if (typeof filter === 'object'){
                        filterFunc = filter.filter;
                        filterThisObj = filter;
                    }
                        
                    output = filterFunc.call(filterThisObj, code, contentType, include, bundle);
                    
                    if (output) {
                        code = output;
                    }
                }, this);
                
                return code;
            },
            
            readBundle: function(bundle, context) {
                var bundleCode = [];
                    
                bundle.forEachInclude(function(include) {
                    var code = include.getCode(context);
                    if (code) {
                        bundleCode.push(this.applyFilter(code, bundle.getContentType(), include, bundle));    
                    }
                }, this);
                
                bundleCode = bundleCode.join("\n");  
                
                var checksum;
                
                if (this.checksumsEnabled !== false || bundle.requireChecksum) {
                    checksum = this.calculateChecksum(bundleCode);
                }
                
                return {
                    code: bundleCode,
                    checksum: checksum
                };
            },
            
            calculateChecksum: function(code) {
                var shasum = crypto.createHash('sha1');
                shasum.update(code);
                var checksum = shasum.digest('hex');
                
                if (this.checksumLength > 0 && checksum.length > this.checksumLength) {
                    checksum = checksum.substring(0, this.checksumLength);
                }
                
                return checksum;
            },
            
            writeBundle: function(bundle, code, checksum) {
                raptor.throwError(new Error("writeBundle() not implemented"));
            },
            
            writePageIncludeHtml: function(pageName, location, html) {
                raptor.throwError(new Error("writeIncludeHtml() not implemented"));
            },
            
            setUrlBuilder: function(urlBuilder) {
                this.urlBuilder = urlBuilder;
            },
            
            getUrlBuilder: function() {
                return this.urlBuilder;
            }
        };

        
        return PageDependenciesWriter;
    });
define.Class(
    "raptor/optimizer/BundleWriter",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var logger = module.logger(),
            crypto = require('crypto'),
            forEach = raptor.forEach,
            OptimizedPage = require('raptor/optimizer/OptimizedPage');
        
        var BundleWriter = function(config, urlBuilder) {
            this.urlBuilder = urlBuilder;
            this.context = raptor.extend({}, (this.config && this.config.context) || {});
            this.config = config;
            
            if (!this.filters) {
                this.filters = [];
            }
            this.context.config = config;
            this.context.writer = this;
        };
        
        BundleWriter.prototype = {
            getConfig: function() {
                return this.config;
            },
            
            addFilter: function(filter) {
                this.filters.push(filter);
            },
            
            writePageBundles: function(pageBundles, basePath) {
                var loaderMetadata = {};
                
                if (!this.context) {
                    this.context = {};
                }
                
                this.context.loaderMetadata = loaderMetadata;

                var optimizedPage = new OptimizedPage();

                var _this = this,
                    context = this.context,
                    config = this.config,
                    writeBundle = function(bundle) {
                        if (bundle.inPlaceDeployment === true) {
                            return;
                        }
                        
                        if (bundle.isWrittenToDisk()) {
                            logger.info("Bundle (" + bundle.getKey() + ") already written to disk. Skipping...");
                            return bundle.checksum;
                        }
                        
                        var bundleData;
                        
                        bundle.getBundleData = function() {
                            if (!bundleData) {
                                bundleData = _this.readBundle(bundle, context);
                                bundle.checksum = bundleData.checksum; 
                            }
                            return bundleData;
                        };
                        
                        bundle.getChecksum = function() {
                            var checksumsEnabled = bundle.checksumsEnabled;
                            if (checksumsEnabled === undefined) {
                                // checksumsEnabled not set for bundle so check optimizer config
                                checksumsEnabled = (config.checksumsEnabled !== false) || bundle.requireChecksum;
                            }

                            return checksumsEnabled ? this.getBundleData().checksum : null;
                        };
                        
                        bundle.getCode = function() {
                            return this.getBundleData().code;
                        };
                        
                        var startTime = new Date().getTime();
                        _this.writeBundle(bundle);
                        logger.info('Bundle "' + bundle.name + '" written to disk in ' + (new Date().getTime() - startTime) + 'ms');
                        bundle.setWrittenToDisk(true);
                    },
                    htmlBySlot = {},
                    addHtml = function(slot, html) {
                        var htmlForSlot = htmlBySlot[slot];
                        if (!htmlForSlot) {
                            htmlForSlot = htmlBySlot[slot] = [];
                        }
                        htmlForSlot.push(html);
                    };
                
                
                if (pageBundles.hasAsyncRequires()) {
                    
                    pageBundles.forEachAsyncRequire(function(asyncRequire) {
                        var entry = loaderMetadata[asyncRequire.getName()] = {
                            requires: [],
                            css: [],
                            js: []
                        };
                        
                        forEach(asyncRequire.getRequires(), function(require) {
                            entry.requires.push(require);
                            
                        }, this);
                        
                        forEach(asyncRequire.getBundles(), function(bundle) {
                            writeBundle(bundle);
                            if (bundle.isJavaScript()) {
                                entry.js.push(this.getBundleUrl(bundle, basePath));
                            }
                            else if (bundle.isStyleSheet()) {
                                entry.css.push(this.getBundleUrl(bundle, basePath));
                            }
                            else {
                                throw raptor.createError(new Error("Invalid bundle content type: " + bundle.getContentType()));
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
                
                
                pageBundles.forEachBundle(function(bundle) {
                    if (bundle.isInline()) {
                        throw raptor.createError(new Error("Inline bundles not yet supported"));
                    }
                    else {
                        writeBundle(bundle);
                        var url = this.getBundleUrl(bundle, basePath || this.config.getBasePath()),
                            html;

                        if (bundle.isJavaScript()) {
                            html = this.getJavaScriptDependencyHtml(url);
                        }
                        else if (bundle.isStyleSheet()) {
                            html = this.getCSSDependencyHtml(url);
                        }
                        else {
                            throw raptor.createError(new Error("Invalid bundle content type: " + bundle.getContentType()));
                        }

                        if (bundle.outputFile) {
                            optimizedPage.addFile(bundle.outputFile, bundle.getContentType());
                        }
                        else if (bundle.sourceResource) {
                            if (bundle.sourceResource.isFileResource()) {
                                optimizedPage.addFile(bundle.sourceResource.getFilePath(), bundle.getContentType());       
                            }
                        }

                        addHtml(bundle.getSlot(), html);
                        optimizedPage.addUrl(url, bundle.getSlot(), bundle.getContentType());
                    }
                }, this);
                
                raptor.forEachEntry(htmlBySlot, function(slot, html) {
                    htmlBySlot[slot] = html.join('\n');
                }, this);
                
                optimizedPage.setHtmlBySlot(htmlBySlot);
                optimizedPage.setLoaderMetadata(loaderMetadata);
                
                return optimizedPage;
            },
            
            getJavaScriptDependencyHtml: function(url) {
                return '<script type="text/javascript" src="' + url + '"></script>';
            },

            getCSSDependencyHtml: function(url) {
                return '<link rel="stylesheet" type="text/css" href="' + url + '">';
            },
            
            getBundleUrl: function(bundle, basePath) {
                var urlBuilder = this.getUrlBuilder();
                if (!urlBuilder) {
                    throw raptor.createError(new Error("URL builder not set."));
                }
                return urlBuilder.buildBundleUrl(bundle, basePath || this.config.getBasePath());
            },
            
            getResourceUrl: function(filename, basePath) {
                var urlBuilder = this.getUrlBuilder();
                if (!urlBuilder) {
                    throw raptor.createError(new Error("URL builder not set."));
                }
                return urlBuilder.buildResourceUrl(filename, basePath || this.config.getBasePath());
            },

            applyFilter: function(code, contentType, dependency, bundle) {
    
                forEach(this.filters, function(filter) {
                    var output,
                        filterFunc,
                        filterThisObj;
                    
                    if (typeof filter === 'function') {
                        filterFunc = filter;
                    }
                    else if (typeof filter === 'string') {
                        filter = require(filter);
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
                        
                    output = filterFunc.call(filterThisObj, code, contentType, dependency, bundle, this.context);
                    
                    if (output) {
                        code = output;
                    }
                }, this);
                
                return code;
            },
            
            readBundle: function(bundle, context) {
                var bundleCode = [];
                    
                bundle.forEachDependency(function(dependency) {
                    var code = dependency.getCode(context);
                    if (code) {
                        bundleCode.push(this.applyFilter(code, bundle.getContentType(), dependency, bundle, context));
                    }
                }, this);
                
                bundleCode = bundleCode.join("\n");  
                
                var checksum;
                
                // see if checksums are explicitly set for the bundle
                var checksumsEnabled = bundle.checksumsEnabled;
                if (checksumsEnabled === undefined) {
                    // checksumsEnabled not set for bundle so check optimizer config
                    checksumsEnabled = (this.config.checksumsEnabled !== false) || bundle.requireChecksum;
                }
                if (checksumsEnabled) {
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
                var checksum = shasum.digest('hex'),
                    checksumLength = this.config.getChecksumLength();
                
                if (checksumLength > 0 && checksum.length > checksumLength) {
                    checksum = checksum.substring(0, checksumLength);
                }
                
                return checksum;
            },
            
            writeBundle: function(bundle, code, checksum) {
                throw raptor.createError(new Error("writeBundle() not implemented"));
            },
            
            writePageDependencyHtml: function(pageName, slot, html) {
                throw raptor.createError(new Error("writeDependencyHtml() not implemented"));
            },

            writeResource: function(resource, contentType, addChecksum) {
                throw raptor.createError(new Error("writeResource() not implemented"));
            },
            
            setUrlBuilder: function(urlBuilder) {
                this.urlBuilder = urlBuilder;
            },
            
            getUrlBuilder: function() {
                return this.urlBuilder;
            }
        };

        
        return BundleWriter;
    });
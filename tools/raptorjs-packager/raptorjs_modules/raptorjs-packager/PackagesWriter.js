raptor.defineClass(
    "raptorjs-packager.PackagesWriter",
    function() {
        var walker = raptor.require('resources.walker'),
            packaging = raptor.require("packaging"),
            files = raptor.require('files');
            forEach = raptor.forEach;
        
        var PackagesWriter = function(options) {
            this.bundles = options.bundles;
            this.outputDir = options.outputDir,
            this.enabledExtensions = options.enabledExtensions;
            this.includeToBundleMapping = {};
            this.nextFileId = 0;
            this.outputBundles = [];
        };
        
        PackagesWriter.prototype = {
            writePackages: function() {

                var mapping = this.includeToBundleMapping;
                
                var _setBundle = function(include, bundle) {
                    mapping[packaging.getIncludeHandler(include.type).includeKey(include)] =  bundle;
                };
                
                //First write all of the preconfigured bundles
                if (this.bundles) {
                    
                    forEach(this.bundles, function(bundle) {
                        var aggregator = new packaging.PackageAggregator();
                        var outputBundle = {
                            filename: 'bundle-' + (bundle.name || this.nextFileId++),
                            aggregator: aggregator
                        };
                        
                        this.outputBundles.push(outputBundle);
                        
                        forEach(bundle.includes, function(include) {
                            _setBundle(include, outputBundle);
                            var includeHandler = packaging.getIncludeHandler(include.type);
                            
                            if (includeHandler.isPackage && includeHandler.isPackage(include)) {
                                var manifest = includeHandler.getManifest(include);
                                
                                manifest.forEachInclude({
                                    callback: function(type, packgeInclude) {
                                        aggregator.handleInclude(packgeInclude, manifest);
                                        _setBundle(packgeInclude, outputBundle);
                                    },
                                    enabledExtensions: this.enabledExtensions,
                                    thisObj: this
                                });
                            }
                            else {
                                aggregator.handleInclude(include);
                                _setBundle(include, outputBundle);
                            }
                        }, this);
                        
                        this.writeBundle(outputBundle, aggregator);
                        
                    }, this);
                }
                
                //Now write the rest of the packages
//                walker.walk(
//                    "/",
//                    function(packageJsonResource) {
//                        
//                        this.writePackage(packageJsonResource);
//                    },
//                    this,
//                    {
//                        resourceFilter: function(resource) {
//                            return resource.isFile() && resource.getName() == "package.json";
//                        },
//                        dirTraverseFilter: function(dir) {
//                            if (dir.getName() === "node_modules") {
//                                return false;
//                            }
//                        }
//                    });
            },
            
            writePackage: function(packageJsonResource) {
                
                var aggregator = new packaging.PackageAggregator();
                aggregator.aggregatePackage(packageJsonResource);
                
                var manifest = packaging.getPackageManifest(packageJsonResource);
                this.writeBundle({
                        filename: "module-" +  manifest.name
                    },
                    aggregator);
            },
            
            writeBundle: function(bundleInfo, aggregator) {
                var filename = bundleInfo.filename,
                    outputFile;
                
                if (aggregator.hasJavaScript()) {
                    outputFile = new files.File(this.outputDir, filename + ".js");
                    
                    var code = [];
                    aggregator.forEachJavaScript(function(js) {
                        code.push("//" + js.path);
                        code.push(js.code);
                    }, this);
                    
                    outputFile.writeFully(code.join("\n"));
                }
                
            }
        };
        
        return PackagesWriter;
    });
require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

xdescribe('optimizer module', function() {
    "use strict";
    
    var logger = require('raptor/logging').logger('raptor-optimizer-spec'),
        forEachEntry = raptor.forEachEntry,
        forEach = raptor.forEach,
        compileAndRender = helpers.templating.compileAndRender,
        compileAndRenderAsync = helpers.templating.compileAndRenderAsync,
        testOptimizer = function(config) {
        
            var enabledExtensions = require('raptor/packaging').createExtensionCollection(config.enabledExtensions);
            var optimizer = require('raptor/optimizer');
            var pageIncludes = config.pageIncludes;
            var done = config.done;
            if (!done) {
                throw new Error('done argument is required');
            }

            var packageManifest = require('raptor/packaging').createPackageManifest();
            packageManifest.setDependencies(pageIncludes);

            logger.debug("--------------------");
            logger.debug('Begin optimizer test for page "' + config.pageName + '":');
            
            var BundleMappings = require('raptor/optimizer/BundleMappings');
            var PageBundles = require('raptor/optimizer/PageBundles');

            function onError(e) {
                done(e);
            }
            
            
            
            //Get the page dependencies
            
            function checkPageBundles(pageBundles) {

                var includesByKey = {},
                    duplicates = [];
                    
                

                var actualBundlesBySlot = {},
                    includeCountsByBundle = {};
                
                var bundleToString = function(bundle, indent) {
                    var code = bundle.readCode();
                    if (code) {
                        code = code.replace(/[\n]/g, '\\n');
                    }
                    return indent + "name: " + bundle.getName() + "\n" + indent + "slot: " + bundle.getSlot() + "\n" + indent + "contentType: " + bundle.getContentType() + "\n" + indent + "code: " + code + "\n" + indent + "checksum: " + bundle.calculateChecksum();
                };
                
                pageBundles.forEachBundle(function(bundle) {
                    var actualBundles = actualBundlesBySlot[bundle.getSlot()];
                    if (!actualBundles) {
                        actualBundles = actualBundlesBySlot[bundle.getSlot()] = [];
                    }
                    
                    actualBundles.push(bundle);
                    logger.debug("Bundle for " + config.pageName + ":\n"+ bundleToString(bundle, "  "));
                    bundle.forEachDependency(function(include) {
                        
                        var key = include.getKey();
                        if (includesByKey[key]) {
                            duplicates.push(include);
                        }
                        else {
                            includesByKey[key] = true;
                        }
                        var includeCount = includeCountsByBundle[bundle.name];
                        if (!includeCount) {
                            includeCountsByBundle[bundle.name] = 0;
                        }
                    });
                });
                
                var compareBundle = function(actual, expected) {
                    if (expected.name) {
                        expect(expected.name).toEqual(actual.getName());
                    }
                    if (expected.slot) {
                        expect(expected.slot).toEqual(actual.getSlot());
                    }
                    if (expected.contentType) {
                        expect(expected.contentType).toEqual(actual.getContentType());
                    }
                    if (expected.code) {
                        expect(expected.code).toEqual(actual.readCode());
                    }
                };
                
                
                if (config.expectedAsyncRequires) {
                    var asyncRequires = [];
                    
                    
                    pageBundles.forEachAsyncRequire(function(asyncRequire) {
                        asyncRequires.push(asyncRequire);
                    });
                    
                    expect(Object.keys(config.expectedAsyncRequires).length).toEqual(asyncRequires.length);
                    
                    forEach(asyncRequires, function(asyncRequire) {
                        
                        logger.debug("\nAsync require " + config.pageName + ":\n  name: " + asyncRequire.getName() + "\n  requires: [" + asyncRequire.getRequires().join(", ") + "]");
                        forEach(asyncRequire.getBundles(), function(bundle) {
                            logger.debug("  Bundle:\n" +  bundleToString(bundle, "    "));
                        });
                        
                        var expectedAsyncRequire = config.expectedAsyncRequires[asyncRequire.getName()];
                        expect(expectedAsyncRequire).toNotEqual(null);
                        
                        if (expectedAsyncRequire) {
                            if (expectedAsyncRequire.bundles) {
                                var actualBundles = asyncRequire.getBundles();
                                forEach(actualBundles, function(actualBundle, i) {
                                    var expectedBundle = expectedAsyncRequire.bundles[i] || {};
                                    compareBundle(actualBundle, expectedBundle);
                                });
                            }
                            
                            if (expectedAsyncRequire.requires) {
                                var actualRequires = asyncRequire.getRequires();
                                forEach(actualRequires, function(actualRequire, i) {
                                    var expectedRequire = expectedAsyncRequire.requires[i];
                                    expect(expectedRequire).toEqual(actualRequire);
                                });
                            }
                        }
                    });

                }

                
                if (config.expectedBundles) {
                    forEachEntry(config.expectedBundles, function(slot, expectedBundles) {
                        var actualBundles = actualBundlesBySlot[slot] || [];
                        expect(actualBundles.length).toEqual(expectedBundles.length);
                        
                        if (actualBundles.length === expectedBundles.length) {
                            forEach(expectedBundles, function(expectedBundle, i) {
                                var actualBundle = actualBundles[i];
                                compareBundle(actualBundle, expectedBundle);
                            }, this);    
                        }
                    });
                }

                expect(duplicates).toEqualArray([]);
                
                forEach(config.expectedMappings, function(expected) {
                    optimizer.forEachDependency({
                        dependencies: expected.include,
                        enabledExtensions: config.enabledExtensions,
                        handleDependency: function(dependency) {
                            if (!dependency.isPackageDependency()) {
                                var targetBundle = pageBundles.getBundleMappings().getBundleForDependency(dependency),
                                    targetBundleName = targetBundle ? targetBundle.getName() : undefined;
                                    
                                if (!targetBundleName && expected.toBundle) {
                                    targetBundleName = "(no bundle for " + dependency.toString() + ")";
                                }
                                expect(targetBundleName).toEqual(expected.toBundle);
                            }
                        },
                        thisObj: this
                    });
                });
                
                
                if (config.expectedBundleCount) {
                    expect(pageBundles.getBundleCount()).toEqual(config.expectedBundleCount);
                }
                
                if (config.test) {
                    config.test(pageBundles);    
                }
                
                if (config.success) {
                    config.success(pageBundles);
                }

                done();
            }

            function buildPageBundles(bundleMappings) {
                
                var pageBundles = new PageBundles({
                    pageName: config.pageName,
                    inPlaceDeploymentEnabled: false,
                    bundlingEnabled: true,
                    sourceUrlResolver: null,
                    enabledExtensions: enabledExtensions,
                    packageManifest: packageManifest,
                    bundleMappings: bundleMappings
                });

                pageBundles.build().then(checkPageBundles, onError);
            }
            
            //Create the bundle mappings from the bundle set
            var bundleMappings = new BundleMappings(config.enabledExtensions);
            var promiseChain = null;

            forEach(config.bundleSet, function(bundleConfig) {
                var bundleName = bundleConfig.name;

                if (!promiseChain) {
                    promiseChain = bundleMappings.addDependenciesToBundle(bundleConfig.includes, bundleName);
                }
                else {
                    promiseChain = promiseChain.then(function() {
                        return bundleMappings.addDependenciesToBundle(bundleConfig.includes, bundleName);
                    }, onError);
                }
            });

            
            if (promiseChain) {
                promiseChain.then(function() {
                    buildPageBundles(bundleMappings);
                })    
            }
            else {
                buildPageBundles(bundleMappings);
            }
            
        };

    it('should handle de-duplication correctly', function(done) {
        testOptimizer({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.optimizer.moduleA" },
                               { "module": "test.optimizer.moduleB" }]
                },
                { 
                    name: "bundleB",
                    includes: [{ "module": "test.optimizer.moduleB" },
                               { "module": "test.optimizer.moduleC" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageA",
            pageIncludes: [{ "module": "test.optimizer.moduleA" },
                           { "module": "test.optimizer.moduleB" },
                           { "module": "test.optimizer.moduleC" }],
                     
            expectedMappings: [{
                                  include: { "module": "test.optimizer.moduleA" },
                                  toBundle: "bundleA"
                              },
                              {
                                  include: { "module": "test.optimizer.moduleB" },
                                  toBundle: "bundleA"
                              },
                              {
                                  include: { "module": "test.optimizer.moduleC" },
                                  toBundle: "bundleB"
                              }],
            expectedBundles: {
                "body": [
                    {
                        name: "bundleA",
                        contentType: "application/javascript",
                        code: "moduleA\nmoduleB"
                    },
                    {
                        name: "bundleB",
                        contentType: "application/javascript",
                        code: "moduleC"
                    }
                ]
            },
            done: done 
                
        });
    });
    
    it('should handle page dependencies correctly', function(done) {
        testOptimizer({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.optimizer.moduleA" }]
                },
                { 
                    name: "bundleB",
                    includes: [{ "module": "test.optimizer.moduleB" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageB",
            pageIncludes: [{ "module": "test.optimizer.moduleA" },
                           { "module": "test.optimizer.moduleB" },
                           { "module": "test.optimizer.moduleC" }],
                           
            expectedMappings: [{
                                  include: { "module": "test.optimizer.moduleA" },
                                  toBundle: "bundleA"
                              },
                              {
                                  include: { "module": "test.optimizer.moduleB" },
                                  toBundle: "bundleB"
                              },
                              {
                                  include: { "module": "test.optimizer.moduleC" },
                                  toBundle: "pageB"
                              }],
            expectedBundles: {
                "body": [
                    {
                        name: "bundleA",
                        contentType: "application/javascript",
                        code: "moduleA"
                    },
                    {
                        name: "bundleB",
                        contentType: "application/javascript",
                        code: "moduleB"
                    },
                    {
                        name: "pageB",
                        contentType: "application/javascript",
                        code: "moduleC"
                    }
                ]
            },
            done: done
        });
    });
    
    it('should allow slot for resource to be overridden', function(done) {
        testOptimizer({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.optimizer.mixedA" },
                               { "module": "test.optimizer.slotA" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageC",
            pageIncludes: [{ "module": "test.optimizer.mixedA" },
                           { "module": "test.optimizer.slotA" }],

            expectedBundles: {
                "head": [
                    {
                        name: "bundleA",
                        contentType: "text/css",
                        code: "mixedA_css"
                    },
                    {
                        name: "bundleA",
                        contentType: "application/javascript",
                        code: "slotA_js"
                    }
                ],
                "body": [
                    {
                        name: "bundleA",
                        contentType: "text/css",
                        code: "slotA_css"
                    },
                    {
                        name: "bundleA",
                        contentType: "application/javascript",
                        code: "mixedA_js"
                    }
                ]
            },
            done: done
        });
    });
    
    it('should allow custom slots for resources', function(done) {
        testOptimizer({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.optimizer.mixedA" },
                               { "module": "test.optimizer.slotB" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageD",
            pageIncludes: [{ "module": "test.optimizer.mixedA" },
                           { "module": "test.optimizer.slotB" }],

            expectedBundles: {
                "head": [
                    {
                        name: "bundleA",
                        contentType: "text/css",
                        code: "mixedA_css"
                    }
                ],
                "custom-head": [
                    {
                        name: "bundleA",
                        contentType: "text/css",
                        code: "slotB_css"
                    }
                ],

                "body": [
                    {
                        name: "bundleA",
                        contentType: "application/javascript",
                        code: "mixedA_js"
                    }
                ],

                "custom-body": [
                    {
                        name: "bundleA",
                        contentType: "application/javascript",
                        code: "slotB_js"
                    }
                ]
            },
            done: done
        });
    });
    
    
    it('should allow asynchronous modules', function(done) {
        testOptimizer({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.optimizer.mixedA" },
                               { "module": "test.optimizer.nestedA" }]
                },
                { 
                    name: "bundleB",
                    includes: [{ "module": "test.optimizer.asyncA" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageE",
            pageIncludes: [{ "module": "test.optimizer.asyncA" }],

            expectedBundles: {
                "head": [
                    {
                        name: "bundleB",
                        contentType: "text/css",
                        code: "asyncA_css"
                    }
                ],

                "body": [
                    {
                        name: "pageE",
                        contentType: "application/javascript",
                        code: "moduleA"
                    },
                    {
                        name: "bundleB",
                        contentType: "application/javascript",
                        code: "asyncA_js"
                    }
                ]
            },
            expectedAsyncRequires: {
                "test.optimizer.mixedA": {
                    requires: [],
                    bundles: [
                        {
                            name: "bundleA",
                            slot: "body",
                            contentType: "application/javascript",
                            code: "mixedA_js\nnestedA_js"
                        },
                        {
                            name: "bundleA",
                            slot: "head",
                            contentType: "text/css",
                            code: "mixedA_css\nnestedA_css"
                        }
                    ]
                },
                "test.optimizer.nestedA": {
                    requires: ["test.optimizer.nestedB"],
                    bundles: [
                        {
                            name: "bundleA",
                            slot: "body",
                            contentType: "application/javascript",
                            code: "mixedA_js\nnestedA_js"
                        },
                        {
                            name: "bundleA",
                            slot: "head",
                            contentType: "text/css",
                            code: "mixedA_css\nnestedA_css"
                        }
                    ]
                },
                "test.optimizer.nestedB": {
                    requires: [],
                    bundles: [
                        {
                            name: "pageE-async",
                            slot: "body",
                            contentType: "application/javascript",
                            code: "nestedB_js"
                        },
                        {
                            name: "pageE-async",
                            slot: "head",
                            contentType: "text/css",
                            code: "nestedB_css"
                        }
                    ]
                }
            },
            done: done
        });
    });
    
    it('should allow page dependencies to be written to disk', function(done) {
        testOptimizer({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.optimizer.mixedA" },
                               { "module": "test.optimizer.nestedA" }]
                },
                { 
                    name: "bundleB",
                    includes: [{ "module": "test.optimizer.asyncA" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageE",
            pageIncludes: [{ "module": "test.optimizer.asyncA" },
                           { type: "loader-metadata" }],

            expectedBundles: {
                "head": [
                    {
                        name: "bundleB",
                        contentType: "text/css",
                        code: "asyncA_css"
                    }
                ],

                "body": [
                    {
                        name: "pageE",
                        contentType: "application/javascript",
                        code: "moduleA"
                    },
                    {
                        name: "bundleB",
                        contentType: "application/javascript",
                        code: "asyncA_js"
                    }
                ]
            },
            expectedAsyncRequires: {
                "test.optimizer.mixedA": {
                    requires: [],
                    bundles: [
                        {
                            name: "bundleA",
                            slot: "body",
                            contentType: "application/javascript",
                            code: "mixedA_js\nnestedA_js"
                        },
                        {
                            name: "bundleA",
                            slot: "head",
                            contentType: "text/css",
                            code: "mixedA_css\nnestedA_css"
                        }
                    ]
                },
                "test.optimizer.nestedA": {
                    requires: ["test.optimizer.nestedB"],
                    bundles: [
                        {
                            name: "bundleA",
                            slot: "body",
                            contentType: "application/javascript",
                            code: "mixedA_js\nnestedA_js"
                        },
                        {
                            name: "bundleA",
                            slot: "head",
                            contentType: "text/css",
                            code: "mixedA_css\nnestedA_css"
                        }
                    ]
                },
                "test.optimizer.nestedB": {
                    requires: [],
                    bundles: [
                        {
                            name: "pageE-async",
                            slot: "body",
                            contentType: "application/javascript",
                            code: "nestedB_js"
                        },
                        {
                            name: "pageE-async",
                            slot: "head",
                            contentType: "text/css",
                            code: "nestedB_css"
                        }
                    ]
                }
            },
            
            done: done,

            success: function(pageBundles) {
                var Config = require('raptor/optimizer/Config');
                var config = new Config();
                config.setOutputDir("/some/dir/static");
                
                var BundleFileWriter = require('raptor/optimizer/BundleFileWriter');
                var BundleUrlBuilder = require('raptor/optimizer/BundleUrlBuilder');
                var urlBuilder = new BundleUrlBuilder("http://localhost:8080/static/");
                var writer = new BundleFileWriter(config, urlBuilder);
                
                var writtenFiles = {};
                
                writer.writeBundleFile = function(outputFile, code) {
                    var outputPath = outputFile.getAbsolutePath();
                    logger.debug('Writing bundle file "' + outputPath + '" to disk. Code: ' + code);
                    writtenFiles[outputPath] = code;
                };
                
                
                var optimizedPage = writer.writePageBundles(pageBundles);
                var htmlBySlot = optimizedPage.getHtmlBySlot();
                expect(htmlBySlot.head).toNotEqual(null);
                expect(htmlBySlot.body).toNotEqual(null);
                expect(Object.keys(writtenFiles).length).toEqual(7);

                done();
            }
        });
    });
    
    xit('should allow output filters', function(done) {
        testOptimizer({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.optimizer.filtersA" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "filters",
            pageIncludes: [{ "module": "test.optimizer.filtersA" }],
            done: done,
            success: function(pageBundles) {
                var Config = require('raptor/optimizer/Config');
                var config = new Config();
                config.setOutputDir("/some/dir/static");
                
                var BundleFileWriter = require('raptor/optimizer/BundleFileWriter');
                var BundleUrlBuilder = require('raptor/optimizer/BundleUrlBuilder');
                var urlBuilder = new BundleUrlBuilder("http://localhost:8080/static/");
                var writer = new BundleFileWriter(config, urlBuilder);
                
                writer.addFilter(function(code, contentType) {
                    if (contentType === 'application/javascript') {
                        return code.toUpperCase();
                    }
                    else if (contentType === 'text/css') {
                        return code.toLowerCase();
                    }
                    else {
                        return code;
                    }
                });
                
                var writtenCode = {};
                
                writer.writeBundleFile = function(outputFile, code) {
                    var outputPath = outputFile.getAbsolutePath();
                    logger.debug('Writing bundle file "' + outputPath + '" to disk. Code: ' + code);
                    writtenCode[code] = outputPath;
                };

                writer.writePageBundles(pageBundles);

                expect(writtenCode["FILTERSA_JS"]).toNotEqual(null);
                expect(writtenCode["filtersa_css"]).toNotEqual(null);
                done();
            }
        });
    });
    
    xit('should allow for a simple optimizer project', function(done) {
        var configPath = require('raptor/files').joinPaths(__dirname, 'resources/optimizer/project-a/optimizer-config.xml');
        var packageResource = require('raptor/resources').createFileResource(require('raptor/files').joinPaths(__dirname, 'resources/optimizer/project-a/page1-package.json'));
        var pageOptimizer = require('raptor/optimizer').createPageOptimizer(configPath);


        pageOptimizer.optimizePage(
            {
                name: "page1",
                packageResource: packageResource
            })
            .then(
                function(optimizedPage) {
                    var pageIncludes = optimizedPage.getHtmlBySlot("page1");
                    expect(pageIncludes.body.indexOf('<script')).toNotEqual(-1);
                    done();
                }, 
                done);
        
        
        
    });
    
    it("should allow for optimizer tags in templates", function(done) {
        var template = require('raptor/templating');
        var renderContext = template.createContext();
        var configPath = require('raptor/files').joinPaths(__dirname, '/resources/optimizer/project-a/optimizer-config.xml');
        require('raptor/optimizer').configure(configPath);

        var pending = 0;

        var runCount = 3;
        var runResults = new Array(runCount);

        function runComplete() {
            if (--pending === 0) {
                done();
            }
        }

        function runTest(num) {
            pending++;
            compileAndRenderAsync("/test-templates/optimizer.rhtml", {}, renderContext)
                .then(
                    function(context) {
                        var output = context.getOutput();
                        runResults[num] = output;
                        runComplete();
                    },
                    done);
        }

        for (var i=0; i<runResults; i++) {
            runTest(i);
        }
    });

    it("should allow for optimizing a page without a configuration file", function(done) {
        
        require('raptor/optimizer').configureDefault();

        var bundles = {},
            File = require('raptor/files/File');

        var oldWriteBundleFile = require('raptor/optimizer').pageOptimizer.getWriter().writeBundleFile;

        require('raptor/optimizer').pageOptimizer.writer.writeBundleFile = function(outputPath, code) {
            var file = new File(outputPath);
            var filename = file.getName();
            bundles[filename] = code;
            logger.debug('Writing bundle file "' + outputPath + '" to disk. Code: ' + code);
        };

        function restoreWriter() {
            require('raptor/optimizer').pageOptimizer.writer.writeBundleFile = oldWriteBundleFile;
        }

        require('raptor/optimizer').optimizePage({
                name: "page1",
                packageFile: require('raptor/files').joinPaths(__dirname, 'resources/optimizer/project-a/page1-package.json')
            })
            .then(
                function(optimizedPage) {
                    console.error(require('raptor/debug').prettyPrint(bundles));
                    console.error(require('raptor/debug').prettyPrint(optimizedPage));

                    expect(Object.keys(optimizedPage.getHtmlBySlot()).length).toEqual(2);
                    expect(optimizedPage.getHtmlBySlot()['body']).toEqual("<script type=\"text/javascript\" src=\"/static/page1-d14bc332.js\"></script>");
                    expect(optimizedPage.getHtmlBySlot()['head']).toEqual("<link rel=\"stylesheet\" type=\"text/css\" href=\"/static/page1-4b176a91.css\">");

                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedA"].requires[0]).toEqual("test.optimizer.nestedB");
                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedA"].requires.length).toEqual(1);

                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedA"].css[0]).toEqual("/static/page1-async-1929e414.css");
                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedA"].css.length).toEqual(1);

                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedA"].js[0]).toEqual("/static/page1-async-c17b7d9b.js");
                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedA"].js.length).toEqual(1);

                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedB"].css[0]).toEqual("/static/page1-async-1929e414.css");
                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedB"].css.length).toEqual(1);

                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedB"].js[0]).toEqual("/static/page1-async-c17b7d9b.js");
                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedB"].js.length).toEqual(1);
                    expect(optimizedPage.getLoaderMetadata()["test.optimizer.nestedB"].hasOwnProperty('requires')).toEqual(false);

                    expect(Object.keys(optimizedPage.getLoaderMetadata()).length).toEqual(2);

                    expect(Object.keys(bundles).length).toEqual(4);
                    expect(bundles["page1-async-c17b7d9b.js"]).toEqual("nestedB_js\nnestedA_js");
                    expect(bundles["page1-async-1929e414.css"]).toEqual("nestedB_css\nnestedA_css");
                    expect(bundles["page1-d14bc332.js"]).toEqual("moduleA\nmixedA_js\nmixedB_js\nasyncA_js");
                    expect(bundles["page1-4b176a91.css"]).toEqual("mixedA_css\nmixedB_css\nasyncA_css");
                    done();
                },
                function(e) {
                    done(e);
                })
            .then(restoreWriter, restoreWriter);
        
        
    });

    it("should allow for accessing page configs loaded from XML configuration file", function() {
        var template = require('raptor/templating');
        var renderContext = template.createContext();
        var configPath = require('raptor/files').joinPaths(__dirname, '/resources/optimizer/project-a/optimizer-config.xml');
        require('raptor/optimizer').configure(configPath);
        var config = require('raptor/optimizer').getDefaultPageOptimizer().getConfig();

        var pageConfigsByName = {};

        config.forEachPageConfig(function(pageConfig) {
            pageConfigsByName[pageConfig.getName()] = pageConfig;
        }, this);

        expect(pageConfigsByName['page1']).toNotEqual(null);
        expect(pageConfigsByName['page2']).toNotEqual(null);
        expect(pageConfigsByName['page3']).toNotEqual(null);
        expect(Object.keys(pageConfigsByName).length).toEqual(3);

        var page2Manifest = pageConfigsByName['page2'].getPackageManifest();
        var page2Dependencies = page2Manifest.getDependencies();
        expect(page2Dependencies.length).toEqual(2);
        expect(page2Dependencies[0].type).toEqual("module");
        expect(page2Dependencies[0].name).toEqual("test.optimizer.moduleA");
        expect(page2Dependencies[1].type).toEqual("module");
        expect(page2Dependencies[1].name).toEqual("test.optimizer.mixedA");

        var page3Manifest = pageConfigsByName['page3'].getPackageManifest();
        var page3Dependencies = page3Manifest.getDependencies();
        expect(page3Dependencies.length).toEqual(4);
        expect(page3Dependencies[0].type).toEqual("module");
        expect(page3Dependencies[0].name).toEqual("test.optimizer.moduleA");
        expect(page3Dependencies[1].type).toEqual("module");
        expect(page3Dependencies[1].name).toEqual("test.optimizer.mixedA");
        expect(page3Dependencies[2].type).toEqual("module");
        expect(page3Dependencies[2].name).toEqual("test.optimizer.mixedB");
        expect(page3Dependencies[3].type).toEqual("module");
        expect(page3Dependencies[3].name).toEqual("test.optimizer.asyncA");
    });

    it("should allow for URLs with the file:// protocol when in-place deployment is enabled", function(done) {
        var template = require('raptor/templating');
        var renderContext = template.createContext();
        var configPath = require('raptor/files').joinPaths(__dirname, '/resources/optimizer/file-urls/optimizer-config.xml');
        var bundles = {},
            File = require('raptor/files/File');

        require('raptor/optimizer').configure(configPath);
        var config = require('raptor/optimizer').getDefaultPageOptimizer().getConfig();

        require('raptor/optimizer').pageOptimizer.getWriter().writeBundleFile = function(outputPath, code) {
            var file = new File(outputPath);
            var filename = file.getName();
            bundles[filename] = code;
            logger.debug('Writing bundle file "' + outputPath + '" to disk. Code: ' + code);
        };

        require('raptor/optimizer').optimizePage({
                name: "page1",
                packageFile: require('raptor/files').joinPaths(__dirname, 'resources/optimizer/file-urls/page1-package.json')
            })
            .then(
                function(optimizedPage) {
                    var jsFiles = optimizedPage.getJavaScriptFiles();
                    var cssFiles = optimizedPage.getCSSFiles();
                    expect(jsFiles.length).toEqual(3);
                    expect(cssFiles.length).toEqual(2);
                    done();
                },
                function(e) {
                    done(e);
                });
    });
});
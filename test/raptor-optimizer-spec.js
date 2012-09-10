require('./_helper.js');

describe('optimizer module', function() {
    var logger = raptor.require('logging').logger('raptor-optimizer-spec'),
        forEachEntry = raptor.forEachEntry,
        forEach = raptor.forEach,
        compileAndRender = helpers.templating.compileAndRender,
        testOptimizer = function(config) {
        
            var optimizer = raptor.require("optimizer");
            var pageIncludes = config.pageIncludes;
            
            var packageManifest = raptor.require('packager').createPackageManifest();
            packageManifest.setIncludes(pageIncludes);

            logger.debug("--------------------");
            logger.debug('Begin optimizer test for page "' + config.pageName + '":');
            //Build the bundle set
            var bundles = [];
            forEach(config.bundleSet, function(bundleConfig) {
                var bundle = optimizer.createBundle(bundleConfig.name);
                forEach(bundleConfig.includes, function(include) {
                    bundle.addInclude(include);
                });
                bundles.push(bundle);
            });
            
            //Create the bundle mappings from the bundle set
            var bundleSet = optimizer.createBundleSet(
                bundles,
                {
                    enabledExtensions: config.enabledExtensions
                });
            
            //Get the page dependencies
            
            var pageDependencies = optimizer.createPageDependencies({
                    pageName: config.pageName,
                    packageManifest: packageManifest,
                    bundleSet: bundleSet,
                    enabledExtensions: config.enabledExtensions
                });
            
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
            
            pageDependencies.forEachPageBundle(function(bundle) {
                var actualBundles = actualBundlesBySlot[bundle.getSlot()];
                if (!actualBundles) {
                    actualBundles = actualBundlesBySlot[bundle.getSlot()] = [];
                }
                
                actualBundles.push(bundle);
                logger.debug("Bundle for " + config.pageName + ":\n"+ bundleToString(bundle, "  "));
                bundle.forEachInclude(function(include) {
                    
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
                
                
                pageDependencies.forEachAsyncRequire(function(asyncRequire) {
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
                optimizer.forEachInclude(
                    expected.include,
                    config.enabledExtensions,
                    function(include) {
                        if (!include.isPackageInclude()) {
                            var targetBundle = pageDependencies.getBundleSet().getBundleForInclude(include),
                                targetBundleName = targetBundle ? targetBundle.getName() : undefined;
                                
                            if (!targetBundleName && expected.toBundle) {
                                targetBundleName = "(no bundle for " + include.toString() + ")";
                            }
                            expect(targetBundleName).toEqual(expected.toBundle);
                        }
                    },
                    this); 
            });
            
            
            if (config.expectedBundleCount) {
                expect(pageDependencies.getBundleCount()).toEqual(config.expectedBundleCount);
            }
            
            if (config.test) {
                config.test(pageDependencies, bundles, bundleSet);    
            }
            
            if (config.done) {
                config.done(pageDependencies, bundles, bundleSet);    
            }
            
        };
    
    before(function() {
        createRaptor();
    });

    it('should handle de-duplication correctly', function() {
        
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
            } 
                
        });
    });
    
    it('should handle page dependencies correctly', function() {
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
            }
        });
    });
    
    it('should allow slot for resource to be overridden', function() {
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
            }
        });
    });
    
    it('should allow custom slots for resources', function() {
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
            }
        });
    });
    
    
    it('should allow asynchronous modules', function() {
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
            }
        });
    });
    
    it('should allow page dependencies to be written to disk', function() {
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
            
            done: function(pageDependencies) {
                var optimizer = raptor.require("optimizer");
                var Config = raptor.require('optimizer.Config');
                var config = new Config();
                config.setOutputDir("/some/dir/static");
                
                var writer = optimizer.createPageDependenciesFileWriter(config);
                
                writer.setUrlBuilder(optimizer.createSimpleUrlBuilder({
                    prefix: "http://localhost:8080/static/"
                }));
                
                var writtenFiles = {};
                
                writer.writeBundleFile = function(outputPath, code) {
                    logger.debug('Writing bundle file "' + outputPath + '" to disk. Code: ' + code);
                    writtenFiles[outputPath] = code;
                };
                
                
                var htmlBySlot = writer.writePageDependencies(pageDependencies);
                expect(htmlBySlot.head).toNotEqual(null);
                expect(htmlBySlot.body).toNotEqual(null);
                expect(Object.keys(writtenFiles).length).toEqual(7);
            }
        });
    });
    
    it('should allow output filters', function() {
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

            done: function(pageDependencies) {
                var optimizer = raptor.require("optimizer");
                var Config = raptor.require('optimizer.Config');
                var config = new Config();
                config.setOutputDir("/some/dir/static");
                
                var writer = optimizer.createPageDependenciesFileWriter(config);
                
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
                
                
                writer.setUrlBuilder(optimizer.createSimpleUrlBuilder({
                    prefix: "http://localhost:8080/static/"
                }));
                
                var writtenCode = {};
                
                writer.writeBundleFile = function(outputPath, code) {
                    logger.debug('Writing bundle file "' + outputPath + '" to disk. Code: ' + code);
                    writtenCode[code] = outputPath;
                };
                
                writer.writePageIncludeHtmlFile = function(outputPath, html) {
                    logger.debug('Writing HTML include file "' + outputPath + '" to disk. Code: ' + html);
                };

                writer.writePageDependencies(pageDependencies);

                expect(writtenCode["FILTERSA_JS"]).toNotEqual(null);
                expect(writtenCode["filtersa_css"]).toNotEqual(null);
                
            }
        });
    });
    
    it('should allow for a simple optimizer project', function() {
        var configPath = raptor.require('files').joinPaths(__dirname, 'resources/optimizer/project-a/optimizer-config.xml' );
        var optimizer = raptor.require('optimizer').createOptimizer(configPath);
        var pageIncludes = optimizer.getPageHtmlBySlot("page1");
        expect(pageIncludes.body.indexOf('<script')).toNotEqual(-1);
        
    });
    
    it("should allow for optimizer tags in templates", function() {
        var template = raptor.require('templating');
        var renderContext = template.createContext();
        var optimizerConfigPath = raptor.require('files').joinPaths(__dirname, '/resources/optimizer/project-a/optimizer-config.xml');
        var optimizer = raptor.require('optimizer').createOptimizer(optimizerConfigPath);
        optimizer.setOptimizerForContext(renderContext);
        
        var output = compileAndRender("/test-templates/optimizer.rhtml", {}, renderContext);
        expect(output.indexOf('<script')).toNotEqual(-1);
    });
});
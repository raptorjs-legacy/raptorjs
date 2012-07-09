require('./_helper.js');

describe('packager.bundler module', function() {
    var forEachEntry = raptor.forEachEntry,
        forEach = raptor.forEach,
        testBundler = function(config) {
        
            var bundler = raptor.require("packager.bundler");
            
            console.log("--------------------");
            console.log('Begin bundler test for page "' + config.pageName + '":');
            //Build the bundle set
            var bundles = [];
            forEach(config.bundleSet, function(bundleConfig) {
                var bundle = bundler.createBundle(bundleConfig.name);
                forEach(bundleConfig.includes, function(include) {
                    bundle.addInclude(include);
                });
                bundles.push(bundle);
            });
            
            //Create the bundle mappings from the bundle set
            var bundleMappings = bundler.createBundleMappings(
                bundles,
                {
                    enabledExtensions: config.enabledExtensions
                });
            
            //Get the page dependencies
            var pageIncludes = config.pageIncludes;
            
            var pageDependencies = bundler.createPageDependencies(
                config.pageName,
                {
                    includes: pageIncludes,
                    bundleMappings: bundleMappings,
                    enabledExtensions: config.enabledExtensions
                });
            
            var includesByKey = {},
                duplicates = [];
                
            var actualBundlesByLocation = {},
                includeCountsByBundle = {};
            
            pageDependencies.forEachBundle(function(bundle) {
                var actualBundles = actualBundlesByLocation[bundle.getLocation()];
                if (!actualBundles) {
                    actualBundles = actualBundlesByLocation[bundle.getLocation()] = [];
                }
                
                actualBundles.push(bundle);
                console.log("Bundle for " + config.pageName + ":\n  name: " + bundle.getName() + "\n  location: " + bundle.getLocation() + "\n  contentType: " + bundle.getContentType() + "\n  code: " + bundle.getCode() + "\n  checksum: " + bundle.getChecksum());
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
            
            if (config.expectedBundles) {
                forEachEntry(config.expectedBundles, function(location, expectedBundles) {
                    var actualBundles = actualBundlesByLocation[location] || [];
                    expect(actualBundles.length).toEqual(expectedBundles.length);
                    
                    if (actualBundles.length === expectedBundles.length) {
                        forEach(expectedBundles, function(expectedBundle, i) {
                            var actualBundle = actualBundles[i];
                            
                            if (expectedBundle.name) {
                                expect(expectedBundle.name).toEqual(actualBundle.getName());
                            }
                            if (expectedBundle.location) {
                                expect(expectedBundle.location).toEqual(actualBundle.getLocation());
                            }
                            if (expectedBundle.contentType) {
                                expect(expectedBundle.contentType).toEqual(actualBundle.getContentType());
                            }
                            if (expectedBundle.code) {
                                expect(expectedBundle.code).toEqual(actualBundle.getCode());
                            }
                        }, this);    
                    }
                });
                
                
            }

            
            expect(duplicates).toEqualArray([]);
            
            forEach(config.expectedMappings, function(expected) {
                bundler.forEachInclude(
                    expected.include,
                    config.enabledExtensions,
                    function(include) {
                        if (!include.isPackageInclude()) {
                            var targetBundle = bundleMappings.getBundleForInclude(include),
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
                config.test(pageDependencies, bundles, bundleMappings);    
            }
            
        };
    
    before(function() {
        createRaptor();
    });

    it('should handle de-duplication correctly', function() {
        
        testBundler({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.bundler.moduleA" },
                               { "module": "test.bundler.moduleB" }]
                },
                { 
                    name: "bundleB",
                    includes: [{ "module": "test.bundler.moduleB" },
                               { "module": "test.bundler.moduleC" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageA",
            pageIncludes: [{ "module": "test.bundler.moduleA" },
                           { "module": "test.bundler.moduleB" },
                           { "module": "test.bundler.moduleC" }],
                     
            expectedMappings: [{
                                  include: { "module": "test.bundler.moduleA" },
                                  toBundle: "bundleA"
                              },
                              {
                                  include: { "module": "test.bundler.moduleB" },
                                  toBundle: "bundleA"
                              },
                              {
                                  include: { "module": "test.bundler.moduleC" },
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
        testBundler({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.bundler.moduleA" }]
                },
                { 
                    name: "bundleB",
                    includes: [{ "module": "test.bundler.moduleB" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageB",
            pageIncludes: [{ "module": "test.bundler.moduleA" },
                           { "module": "test.bundler.moduleB" },
                           { "module": "test.bundler.moduleC" }],
                           
            expectedMappings: [{
                                  include: { "module": "test.bundler.moduleA" },
                                  toBundle: "bundleA"
                              },
                              {
                                  include: { "module": "test.bundler.moduleB" },
                                  toBundle: "bundleB"
                              },
                              {
                                  include: { "module": "test.bundler.moduleC" },
                                  toBundle: "page-pageB"
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
                        name: "page-pageB",
                        contentType: "application/javascript",
                        code: "moduleC"
                    }
                ]
            }
        });
    });
    
    it('should location for resource to be overridden', function() {
        testBundler({
            bundleSet: [
                { 
                    name: "bundleA",
                    includes: [{ "module": "test.bundler.mixedA" },
                               { "module": "test.bundler.locationA" }]
                }
            ],
            enabledExtensions: ["jquery", "browser"],
            pageName: "pageC",
            pageIncludes: [{ "module": "test.bundler.mixedA" },
                           { "module": "test.bundler.locationA" }],

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
                        code: "locationA_js"
                    }
                ],
                "body": [
                    {
                        name: "bundleA",
                        contentType: "text/css",
                        code: "locationA_css"
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
    
});
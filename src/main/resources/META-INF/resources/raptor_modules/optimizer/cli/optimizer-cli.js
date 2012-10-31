raptor.define('optimizer.cli', function() {
    var files = raptor.require('files'),
        resources = raptor.require('resources'),
        optimizer = raptor.require('optimizer'),
        File = files.File,
        startsWith = raptor.require('strings').startsWith,
        endsWith = raptor.require('strings').endsWith,
        logger = raptor.require('logging').logger('optimizer.cli'),
        cwd = process.cwd();

    return {
        
        run: function(args, basePath) {
            if (!basePath) {
                basePath = cwd;
            }
            
            var pageName,
                packageManifest = null,
                packagePath,
                dependencies,
                sourceDirs,
                configPath,
                outputDirPath,
                minify,
                params;

            var resolveFile = function(path) {
                if (!path) {
                    return path;
                }
                
                return new File(files.resolvePath(basePath, path));
            };
            
            argv = require('optimist')(args)
                .usage('Usage: $0 -n <page-name> -p <path-to-package.json> -s ./modules -d my-module,/some-resource.js -c optimizer-config.xml')
                .alias('n', 'name')
                .describe('n', 'The name of the page being optimized (e.g. "my-page")')
                .alias('p', 'package')
                .describe('p', 'A package manifest describing page dependencies')
                .alias('d', 'dependencies')
                .describe('d', 'A comma-separated list of dependencies to be optimized (e.g. "my-module,/some-resource.js"')
                .alias('o', 'out')
                .describe('o', 'The output directory for static bundles and optimized page JSON files.')
                .alias('s', 'source')
                .describe('s', 'A comma-separated list of source directories to search for modules and resources')
                .alias('c', 'config')
                .describe('c', 'Path to an optimizer XML configuration file')
                .alias('m', 'minify')
                .boolean('m')
                .describe('m', 'Enable JavaScript and CSS minification (disabled by default)')
                .check(function(argv) {

                    pageName = argv['name'];
                    packagePath = argv['package'];
                    dependencies = argv['dependencies'];
                    sourceDirs = argv['source'];
                    configPath = argv['config'];
                    outputDirPath = argv['out'];
                    minify = argv['minify'];
                    params = argv._;

                    if (configPath) {
                        configPath = resolveFile(configPath);
                        if (!configFile.exists()) {
                            throw 'Configuration file not found at path "' + configPath + '".';
                        }
                        optimizer.configure(configPath, params);
                    }


                    if (packagePath) {
                        packagePath = resolveFile(packagePath);
                        if (!packagePath.exists()) {
                            throw 'Package manifest not found at path "' + packagePath + '".';
                        }

                        packageManifest = raptor.require('packaging').getPackageManifest(resources.createFileResource(packagePath));
                    }

                    if (argv['dependencies'] && argv['package']) {
                        throw 'Invalid Options. The "dependencies" and "package" options cannot be used together.';
                    }

                    if (!argv['dependencies'] && !argv['package']) {
                        //Maybe we can find the package manifest from the page configured in the optimizer config...
                        
                        if (!argv['config']) {
                            throw 'Invalid Options. Either the "dependencies", "package" or "config" must be provided.';    
                        }
                        else if (argv['name']) {
                            //See if a page config with the provided name exists in the configuration file
                            var pageConfig = optimizer.getDefaultPageOptimizer().getConfig().getPageConfig(pageName);
                            if (!pageConfig) {
                                throw 'Invalid Options. Page with name "' + pageName + '" not found in configuration file at path "' + configPath + '".';    
                            }

                            packageManifest = pageConfig.getPackageManifest();
                            if (!packageManifest) {
                                throw 'Invalid Options. Page with name "' + pageName + '" does not have any dependencies defined in found in configuration file at path "' + configPath + '".';    
                            }
                        }
                        else {
                            throw 'Invalid Options. Either the "dependencies" or "package" option must be specified or the "name" property and a "config" must be provided.';    
                        }
                        
                    }

                    // if (argv['dependencies'] && !argv['name']) {
                    //     throw 'Invalid Options. The "name" option is required when using the "dependencies" option.';
                    // }

                    if (argv['package'] && !argv['name']) {
                        if (packageManifest.name) {
                            argv['name'] = packageManifest.name;
                        }
                        // else {
                        //     throw 'Invalid Options. The "name" option is required when using the "package" option.';    
                        // }
                    }
                })
                .argv; 


            
            

            if (params) {
                var parsedParams = {};
                params.forEach(function(param) {
                    var eqIndex = param.indexOf('=');
                    if (eqIndex != -1) {
                        var name = param.substring(0, eqIndex);
                        var value = param.substring(eqIndex+1);
                        if (value === 'true') {
                            value = true;
                        }
                        else if (value === 'false') {
                            value = true;
                        }
                        parsedParams[name] = value;
                    }
                });
                params = parsedParams;
            }

            if (dependencies) {
                dependencies = dependencies.split(/[,;]/);
                var asyncFound = false;
                
                dependencies.forEach(function(dependency, i) {
                    var async = false;
                    if (endsWith(dependency, "?")) {
                        dependency = dependency.substring(0, dependency.length-1);
                        async = true;
                    }
                    else if (startsWith(dependency, "?")) {
                        dependency = dependency.substring(1);
                        async = true;
                    }
                    if (dependency.charAt(0) === '/') { //Treat
                        if (endsWith(dependency, "package.json")) {
                            dependencies[i] = { "package":  dependency};
                        }
                        else {
                            dependencies[i] = { "path":  dependency};
                        }
                    }
                    else if (startsWith(dependency, './')) {
                        dependency = resolveFile(dependency).getAbsolutePath();
                        if (endsWith(dependency, "package.json")) {
                            dependencies[i] = { "package":  dependency};
                        }
                        else {
                            dependencies[i] = { "path":  dependency};
                        }
                        
                    }
                    else {
                        dependencies[i] = { "module": dependency };
                    }
                    
                    if (async) {
                        asyncFound = true;
                        dependencies[i].async = true;
                    }
                });
                
                if (asyncFound) {
                    dependencies.push({"module": "loader.require"});
                    dependencies.push({"type": "loader-metadata"});
                }

                packageManifest = raptor.require("packaging").createPackageManifest({
                        dependencies: dependencies
                    },
                    resources.createFileResource(cwd));
            }

            resources.addSearchPathDir(resolveFile(".").getAbsolutePath());
            var defaultModulesDir = resolveFile("raptor_modules");

            if (defaultModulesDir.exists()) {
                resources.addSearchPathDir(defaultModulesDir.getAbsolutePath());    
            }

            if (sourceDirs) {
                sourceDirs = sourceDirs.split(/[,;:]/);
                sourceDirs.forEach(function(sourceDir) {
                    resources.addSearchPathDir(resolveFile(sourceDir).getAbsolutePath());
                });
            }

            var config = optimizer.getDefaultPageOptimizer().getConfig();

            if (minify) {
                logger.info("Enabled JavaScript and CSS minification");
                config.enableMinification();
            }

            if (outputDirPath) {
                config.setOutputDir(outputDirPath);
            }

            optimizer.configure(config); //Reconfigure the optimizer

            var optimizerConfig = optimizer.getDefaultPageOptimizer().getConfig();

            var pagesToOptimize = [];
            if (packageManifest) {
                pagesToOptimize.push({
                    name: pageName || 'unnamed-page',
                    packageManifest: packageManifest
                });
            }
            else {
                
                optimizerConfig.forEachPageConfig(function(pageConfig) {
                    var pageName = pageConfig.getName();
                    var packageManifest = pageConfig.getPackageManifest();
                    if (pageName && packageManifest) {
                        pagesToOptimize.push({
                            name: pageName,
                            packageManifest: packageManifest
                        });
                    }
                });

                if (pagesToOptimize.length === 0) {
                    console.error('No pages found to optimize in "' + argv['config'] + '"');
                    return;
                }

            }

            var outputDir = optimizerConfig.getOutputDir();

            pagesToOptimize.forEach(function(pageConfig) {
                logger.info('Optimizing page with name "' + pageConfig.name + '"...');

                var optimizedPage = optimizer.optimizePage(pageConfig);
                var jsonOutputPath = new File(outputDir, pageConfig.name + "-optimized.json").getAbsolutePath();
                logger.info('Writing JSON data for optimized page to "' + jsonOutputPath + '"...');
                var json = optimizedPage.toJSON();
                var jsonFile = new File(jsonOutputPath);
                jsonFile.writeAsString(json);
            });

            console.log("Optimization successfully completed!");
        }
    };
});



    

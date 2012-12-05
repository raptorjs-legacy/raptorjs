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
                dependencies = [],
                sourceDirs,
                configPath,
                outputDirPath,
                minify,
                params,
                parseDependencies = function(dependencies) {
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
                };

            var resolveFile = function(path) {
                if (!path) {
                    return path;
                }
                
                return new File(files.resolvePath(basePath, path));
            };


            
            argv = require('optimist')(args)
                .usage('Usage: $0 [dependency-1] [dependency-2] [dependency-n] [options]\nExamples:\n' + 
                       '  Optimize a set of dependencies:\n' + 
                       '   $0 my-module /some-resource.js --name test-page --source=path/to/my-modules\n\n' + 
                       '  Optimize a package:\n' + 
                       '   $0 --name test-page --package path/to/package.json --source=path/to/my-modules\n\n' + 
                       '  Optimize using a configuration file:\n' + 
                       '   $0 --name test-page --package path/to/package.json --source=path/to/my-modules --config path/to/optimizer-config.xml\n\n' + 
                       '  Optimize all of the pages defined in a configuration file:\n' + 
                       '   $0 --config path/to/optimizer-config.xml\n' + 
                       '\n' +
                       'NOTE: Modules to download asynchronously should be suffixed with a question mark. For example:\n' + 
                       '  Optimize a page with an asynchronous dependency:\n' + 
                       '   $0 my-module my-async-module? --name test-page\n')
                .alias('n', 'name')
                .describe('n', 'The name of the page being optimized (e.g. "my-page")')
                .alias('p', 'package')
                .describe('p', 'A package manifest describing page dependencies')
                .alias('o', 'out')
                .describe('o', 'The output directory for static bundles and optimized page JSON files')
                .alias('s', 'source')
                .describe('s', 'A comma-separated list of source directories to search for modules and resources')
                .alias('c', 'config')
                .describe('c', 'Path to an optimizer XML configuration file')
                .alias('m', 'minify')
                .boolean('m')
                .describe('m', 'Enable JavaScript and CSS minification (disabled by default)')
                .alias('h', 'help')
                .describe('h', 'Display this usage information')
                .check(function(argv) {
                    if (argv['help']) {
                        throw '';
                    }

                    if (args.length === 2) {
                        throw '';   
                    }

                    pageName = argv['name'];
                    packagePath = argv['package'];
                    sourceDirs = argv['source'];
                    configPath = argv['config'];
                    outputDirPath = argv['out'];
                    minify = argv['minify'];
                    params = argv._;
                    if (params) {
                        var parsedParams = {};
                        for (var i=2, len=params.length, param; i<len; i++) {
                            param = params[i];
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
                            else {
                                dependencies.push(param)
                            }
                        }
                        params = parsedParams;
                    }

                    parseDependencies(dependencies);

                    if (outputDirPath) {
                        outputDirPath = resolveFile(outputDirPath);
                    }
                    
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

                    if (dependencies.length && argv['package']) {
                        throw 'Invalid Options. Dependencies cannot be provided in conjunction with the "package" option.';
                    }

                    if (!dependencies.length && !argv['package']) {
                        //Maybe we can find the package manifest from the page configured in the optimizer config...
                        
                        if (!argv['config']) {
                            throw 'Invalid Options. Either dependencies must be provided or the "package" or "config" option must be provided.';    
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
                            throw 'Invalid Options. No dependencies provided.';    
                        }
                        
                    }

                    if (argv['package'] && !argv['name']) {
                        if (packageManifest.name) {
                            argv['name'] = packageManifest.name;
                        }
                    }
                })
                .argv; 


            
            

            

            if (dependencies.length) {
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



    

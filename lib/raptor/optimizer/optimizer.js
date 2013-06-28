/**
 * The optimizer module is used to generated optimized
 * web pages--including optimized resource bundles and the HTML markup
 * to dependency the optimized resource bundles in an HTML page.
 *
 * Simple usage:
 * <js>
 * var optimizer = require('raptor/optimizer');
 * optimizer.configure('path/to/optimizer-config.xml', params);
 * var optimizedPage = optimizer.optimizePage({
 *         name: "test-page",
 *         packageManifest: 'path/to/test-page-package.json'
 *     });
 *
 * var headHtml = optimizedPage.getSlotHtml('head');
 * var bodyHtml = optimizedPage.getSlotHtml('body');
 * var loaderMeta = optimizedPage.getLoaderMetadata();
 * ...
 * </js>
 *
 * For more information, please see the <a href="http://raptorjs.org/optimizer/">Optimizer Documentation</a>.
 */
define(
    "raptor/optimizer",
    ['raptor'],
    function(raptor, require, exports, module) {
        "use strict";
        
        var forEach = raptor.forEach,
            File = require('raptor/files/File'),
            packaging = require('raptor/packaging'),
            Config = require('raptor/optimizer/Config'),
            PageOptimizer = require('raptor/optimizer/PageOptimizer'),
            promises = require('raptor/promises'),
            logger = module.logger();
        
        
        var defaultConfig = new Config();
        defaultConfig.setOutputDir(new File(require('raptor/process').cwd(), 'static'));
        defaultConfig.enableExtension("browser");

        var optimizer = {
            /**
             * @type optimizer.Config
             */
            defaultConfig: defaultConfig,
            
            /**
             * @type raptor/optimizer/PageOptimizer
             */
            pageOptimizer: null,
            
            getDefaultConfig: function() {
                return this.defaultConfig;
            },

            /**
             * Returns the configuration for the default page optimizer
             */
            getConfig: function() {
                return this.pageOptimizer.getConfig();
            },
            
            getDefaultPageOptimizer: function() {
                return this.pageOptimizer;
            },

            /**
             * Optimizes a page based on the page options provided.
             *
             * Supported options:
             * <ul>
             *     <li><b>name</b> {String}: The name of the page. This property is used to determine the name for page bundles and it is also used for any page-specific configuration options. [REQUIRED]
             *     <li><b>basePath</b> {String}: A directory name used to generate relative URLs to resource bundles. The base path will typically be the output directory for the page. This option is ignored if the optimizer is configured to use a URL prefix.
             *     <li><b>enabledExtensions</b> {Array|Object|{@link raptor/packaging/PackageExtension}}: A collection of extensions that should be enabled when generating the optimized page bundles
             *     <li><b>packageManifest</b> {{@link raptor/packaging/PackageManifest}|{@link raptor/resources/Resource}|{@link raptor/files/File}|String}: A package manifest for the page that describes the page dependencies
             * </ul>
             *
             * @param  {options} options Information about the page being optimized (see above for supported options)
             * @return {raptor/optimizer/OptimizedPage} The object that represents the optimized page.
             */
            optimizePage: function(options) {
                return this.pageOptimizer.optimizePage(options);
            },

            /**
             * Resets the optimizer back to the default configuration.
             */
            configureDefault: function() {
                this.pageOptimizer = new PageOptimizer(defaultConfig);
            },
            
            /**
             * Configures the default page optimizer instance using the provided
             * configuration and configuration params.
             *
             * @param  {raptor/optimizer/Config|String|raptor/files/File|raptor/resources/Resource} config The configuration to use
             * @param  {Object} params An object with name/value pairs that are used for variable substitutions in the XML configuration file. If a {@link optimimizer.Config} object is provided then this parameter is ignored.
             * @return {void}
             */
            configure: function(config, params) {
                var pageOptimizer = this.createPageOptimizer(config, params);
                this.pageOptimizer = pageOptimizer;
            },
            
            /**
             * Creates a new instance of a page optimizer using the provided configuration and params.
             *
             * @param config {raptor/optimizer/Config|String|raptor/files/File|raptor/resources/Resource} config The configuration to use
             * @param params {Object} params An object with name/value pairs that are used for variable substitutions in the XML configuration file. If a {@link optimimizer.Config} object is provided then this parameter is ignored.
             * @returns {raptor/optimizer/PageOptimizer} A new instance of a configured page optimizer
             */
            createPageOptimizer: function(config, params) {
                if (!config) {
                    config = defaultConfig;
                }
                else {
                    if (typeof config === 'string' || config instanceof File || config instanceof require('raptor/resources/Resource')) {
                        config = this.loadConfigXml(config, params);
                    }
                }
                
                
                var PageOptimizer = require('raptor/optimizer/PageOptimizer');
                var pageOptimizer = new PageOptimizer(config);
                return pageOptimizer;
            },
            
            /**
             *
             * @param configFile {raptor/files/File|raptor/resources/Resource|String} The configuration file to load. Either a File object, a Resource object, or a file path.
             * @param params {Object} Variables that can be used inside the XML file in the following format:  s${&ltvariable-name}
             * @returns {optimizer.Config} The configuration object
             */
            loadConfigXml: function(configFile, params) {
                var Config = require('raptor/optimizer/Config');
                var Resource = require('raptor/resources/Resource');
                
                var config = new Config(params);
                var configXml;
                var configPath = null;
                
                if (typeof configFile === 'string') {
                    configFile = new File(configFile);
                }
                
                if (configFile instanceof File) {
                    configXml = configFile.readAsString("UTF-8");
                    config.setConfigResource(require('raptor/resources').createFileResource(configFile));
                    configPath = configFile.getAbsolutePath();
                }
                else if (configFile instanceof Resource) {
                    configXml = configFile.readAsString("UTF-8");
                    config.setConfigResource(configFile);
                    configPath = configFile.getURL();
                }

                config.parseXml(configXml, configPath);

                if (!config.outputDir) {
                    config.outputDir = resolvePath("static");
                }

                config.notifyPlugins('configLoaded', {
                    config: config,
                    path: configPath
                });
                
                return config;
            },

            /**
             * Helper method to walk all dependencies recursively
             *
             * @param options
             */
            forEachDependency: function(options) {

                var enabledExtensions = options.enabledExtensions,
                    dependencyCallback = options.handleDependency,
                    packageCallback = options.handlePackage,
                    thisObj = options.thisObj,
                    dependencies = options.dependencies,
                    packages = options.packages,
                    context = options.context || {},
                    _this = this,
                    deferred = promises.defer(),
                    alreadyResolved = promises.defer();
                
                function done() {
                    deferred.resolve();
                }

                function onError(e) {
                    deferred.reject(e);
                }

                alreadyResolved.resolve();
                alreadyResolved = alreadyResolved.promise;
    
                var foundDependencies = {};
                
                function handleManifest(manifest, parentPackage, recursive, depth, async, jsSlot, cssSlot) {
                    try
                    {
                        var foundKey = manifest.getKey() + "|" + async;
                        

                        
                        context.recursive = recursive === true;
                        context.depth = depth;
                        context.async = async === true;
                        context.jsSlot = jsSlot;
                        context.cssSlot = cssSlot;
                        context.parentPackage = parentPackage;
                        
                        var recurseIntoPackage = packageCallback ? packageCallback.call(thisObj, manifest, context) : true;
                        if (recurseIntoPackage === false || foundDependencies[foundKey]) { //Avoid infinite loop by keeping track of which packages we have recursed into
                            return alreadyResolved;
                        }

                        foundDependencies[foundKey] = true;
                        
                        if (recursive === true || depth <= 0) {

                            var promiseChain = null;

                            manifest.forEachDependency(
                                function(type, packageDependency) {
                                    
                                    function handleCurrentDependency() {
                                        return handleDependency(packageDependency, manifest, recursive, depth+1, async || packageDependency.isAsync(), jsSlot, cssSlot);
                                    }

                                    if (promiseChain) {
                                        promiseChain = promiseChain.then(handleCurrentDependency);
                                    }
                                    else {
                                        promiseChain = handleCurrentDependency();
                                    }
                                },
                                _this,
                                {
                                    enabledExtensions: enabledExtensions
                                });

                            if (promiseChain) {
                                promiseChain.done();
                                return promiseChain;
                                
                            }
                            else {
                                return alreadyResolved;
                            }
                        }
                        else {
                            return alreadyResolved; // Always return a promise
                        }
                    }
                    catch(e) {
                        logger.error(e);
                        onError(e);
                        throw e;
                    }
                };
                
                function handleDependency(dependency, parentPackage, recursive, depth, async, jsSlot, cssSlot) {
                    try
                    {
                        context.recursive = recursive === true;
                        context.depth = depth;
                        context.async = async === true;
                        context.parentPackage = parentPackage;
                        context.jsSlot = jsSlot;
                        context.cssSlot = cssSlot;

                        if (dependency.isPackageDependency()) {
                            var dependencyManifest = dependency.getManifest(context);

                            if (!dependencyManifest) {
                                return onError(raptor.createError(new Error("Dependency manifest not found for package dependency: " + dependency.toString())));
                            }

                            var doHandleManifest = function(dependencyManifest) {
                                return handleManifest(dependencyManifest, parentPackage, recursive, depth, async, dependency.getJavaScriptSlot() || jsSlot, dependency.getStyleSheetSlot() || cssSlot);
                            }

                            if (promises.isPromise(dependencyManifest)) {
                                return dependencyManifest.then(function(dependencyManifest) {
                                    return doHandleManifest(dependencyManifest);
                                },
                                onError);
                            }
                            else {
                                return doHandleManifest(dependencyManifest);
                            }
                        }
                        else {
                            var slot = dependency.getSlot();
                            if (!slot) {
                                if (dependency.getContentType() === 'application/javascript') {
                                    slot = jsSlot || 'body';
                                }
                                else {
                                    slot = cssSlot || 'head';
                                }
                            }

                            context.slot = slot;
                            
                            dependencyCallback.call(thisObj, dependency, context);
                            return alreadyResolved;
                        }
                    }
                    catch(e) {
                        logger.error(e);
                        onError(e);
                        throw e;
                    }
                };

                

                var i = -1;

                function handleNextDependency() {
                    i++;

                    if (i >= dependencies.length) {
                        done();
                        return;
                    }

                    var dependency = packaging.createDependency(dependencies[i]);
                    handleDependency(
                        dependency,
                        null,
                        options.recursive === true || dependency.recursive === true,
                        0,
                        dependency.isAsync()).then(handleNextDependency);
                }

                function handleNextPackage() {
                    i++;

                    if (i >= packages.length) {
                        done();
                        return;
                    }

                    var packageManifest = packages[i];
                    handleManifest(
                        packageManifest,
                        null,
                        options.recursive === true,
                        -1,
                        false).then(handleNextPackage);
                }

                if (dependencies) {
                    if (!Array.isArray(dependencies)) {
                        dependencies = [dependencies];
                    }

                    handleNextDependency();
                }
                else if (packages) {
                    if (!Array.isArray(packages)) {
                        packages = [packages];
                    }
                    handleNextPackage();
                }

                return deferred.promise;
            },
            
            /**
             * This method will update a context object to enable the provided extension so that the set of enabled
             * extensions for the context can later be retrieved using  {@link raptor/optimizer#getEnabledExtensionsForContext}
             *
             * This method expects an object that supports a <code>getAttributes()</code> method (typically a {@link raptor/templating/Context} object).
             *
             * @param context {Object} The context object to update
             * @param extension {String} The extension to enable
             */
            enableExtensionForContext: function(context, extension) {
                if (context.getAttributes) {
                    context = context.getAttributes();
                }
                var extensions = context.optimizerExtensions;
                if (!extensions) {
                    extensions = packaging.createExtensionCollection();
                }
                extensions.add(extension);
            },
            
            /**
             * This method will update a context object to disable the provided extension so that the set of enabled
             * extensions for the context can later be retrieved using  {@link raptor/optimizer#getEnabledExtensionsForContext}
             *
             * This method expects an object that supports a <code>getAttributes()</code> method (typically a {@link raptor/templating/Context} object).
             *
             * @param context {Object} The context object to update
             * @param extension {String} The extension to disable
             */
            disableExtensionForContext: function(context, extension) {
                if (context.getAttributes) {
                    context = context.getAttributes();
                }
                
                var extensions = context.optimizerExtensions;
                if (extensions) {
                    extensions.remove(extension);
                }
                
            },
            
            /**
             * Returns the set of enabled extensions associated with the provided context.
             *
             * @param context {Object}
             * @returns {packaging.ExtensionCollection} The set of enabled extensions.
             *
             * @see {@link raptor/optimizer#enableExtensionForContext}
             * @see {@link raptor/optimizer#disableExtensionForContext}
             */
            getEnabledExtensionsForContext: function(context) {
                if (context.getAttributes) {
                    context = context.getAttributes();
                }
                
                return context.optimizerExtensions;
            }
        }; //end optimizer

        optimizer.configureDefault();

        return optimizer;
    });
/**
 * The optimizer module is used to generated optimized
 * web pages--including optimized resource bundles and the HTML markup
 * to include the optimized resource bundles in an HTML page.
 * 
 * Simple usage:
 * <js>
 * var optimizer = raptor.require('optimizer');
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
raptor.define(
    "optimizer", 
    function(raptor) {
        "use strict";
        
        var forEach = raptor.forEach,
            files = raptor.require('files'),
            File = files.File,
            packaging = raptor.require('packaging'),
            Config = raptor.require('optimizer.Config'),
            PageOptimizer = raptor.require('optimizer.PageOptimizer');
        
        
        var defaultConfig = new Config();
        defaultConfig.setOutputDir(new File(raptor.require('process').cwd(), 'static'));
        defaultConfig.enableExtension("browser");

        var optimizer = {
            /**
             * @type optimizer.Config
             */
            defaultConfig: defaultConfig,
            
            /**
             * @type optimizer.PageOptimizer
             */
            pageOptimizer: null,

            /**
             * Optimizes a page based on the page options provided. 
             * 
             * Supported options:
             * <ul>
             *     <li><b>name</b> {String}: The name of the page. This property is used to determine the name for page bundles and it is also used for any page-specific configuration options. [REQUIRED]
             *     <li><b>basePath</b> {String}: A directory name used to generate relative URLs to resource bundles. The base path will typically be the output directory for the page. This option is ignored if the optimizer is configured to use a URL prefix.
             *     <li><b>enabledExtensions</b> {Array|Object|{@link packaging.PackageExtension}}: A collection of extensions that should be enabled when generating the optimized page bundles
             *     <li><b>packageManifest</b> {{@link packaging.PackageManifest}|{@link resources.Resource}|{@link files.File}|String}: A package manifest for the page that describes the page dependencies
             * </ul>
             * 
             * @param  {options} options Information about the page being optimized (see above for supported options)
             * @return {optimizer.OptimizedPage} The object that represents the optimized page.
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
             * @param  {optimizer.Config|String|files.File|resources.Resource} config The configuration to use
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
             * @param config {optimizer.Config|String|files.File|resources.Resource} config The configuration to use
             * @param params {Object} params An object with name/value pairs that are used for variable substitutions in the XML configuration file. If a {@link optimimizer.Config} object is provided then this parameter is ignored.
             * @returns {optimizer.PageOptimizer} A new instance of a configured page optimizer
             */
            createPageOptimizer: function(config, params) {
                if (!config) {
                    config = defaultConfig;
                }
                else {
                    if (typeof config === 'string' || config instanceof File || raptor.require('resources.Resource')) {
                        config = this.loadConfigXml(config, params);
                    }    
                }
                
                
                var PageOptimizer = raptor.require('optimizer.PageOptimizer');
                var pageOptimizer = new PageOptimizer(config);
                return pageOptimizer;
            },
            
            /**
             * 
             * @param configFile {files.File|resources.Resource|String} The configuration file to load. Either a File object, a Resource object, or a file path.
             * @param params {Object} Variables that can be used inside the XML file in the following format:  s${&ltvariable-name}
             * @returns {optimizer.Config} The configuration object
             */
            loadConfigXml: function(configFile, params) {
                var Config = raptor.require('optimizer.Config');
                var Resource = raptor.require('resources.Resource');
                
                var config = new Config(params);
                var configXml;
                
                if (typeof configFile === 'string') {
                    configFile = new File(configFile);
                }
                
                if (configFile instanceof File) {
                    configXml = configFile.readAsString("UTF-8");
                    config.setConfigResource(raptor.require('resources').createFileResource(configFile));
                }
                else if (configFile instanceof Resource) {
                    configXml = configFile.readAsString("UTF-8");
                    config.setConfigResource(configFile);
                }

                config.parseXml(configXml, configFile.getAbsolutePath());
                return config;
            },

            /**
             * Helper method to walk all dependencies recursively
             * 
             * @param options
             */
            forEachInclude: function(options) {
    
               
                var enabledExtensions = options.enabledExtensions, 
                    includeCallback = options.handleInclude,
                    packageCallback = options.handlePackage,
                    thisObj = options.thisObj;
    
    
                var foundIncludes = {};
                
                var handleManifest = function(manifest, parentPackage, recursive, depth, async) {
                    var foundKey = manifest.getKey() + "|" + async;
                    
                    var context = {
                            recursive: recursive === true, 
                            depth: depth, 
                            async: async === true,
                            parentPackage: parentPackage
                        };
                    
                    var recurseIntoPackage = packageCallback.call(thisObj, manifest, context);
                    if (recurseIntoPackage === false || foundIncludes[foundKey]) { //Avoid infinite loop by keeping track of which packages we have recursed into
                        return;
                    }    
                    
                    if (recursive === true || depth <= 0) {

                        manifest.forEachInclude(
                            function(type, packageInclude) {
                                
                                handleInclude.call(this, packageInclude, manifest, recursive, depth+1, async || packageInclude.isAsync());
                            },
                            this,
                            {
                                enabledExtensions: enabledExtensions
                            });
                    }

                };
                
                var handleInclude = function(include, parentPackage, recursive, depth, async) {
                    var foundKey = include.getKey() + "|" + async;
                    if (foundIncludes[foundKey]) {
                        return; //Include already handled
                    }
                    
                    foundIncludes[foundKey] = true;
                    
                    var context = {
                        recursive: recursive === true, 
                        depth: depth, 
                        async: async === true,
                        parentPackage: parentPackage
                    };
                    
                    if (include.isPackageInclude()) {
                        var dependencyManifest = include.getManifest();
                        
                        if (!dependencyManifest) {
                            throw raptor.createError(new Error("Dependency manifest not found for package include: " + include.toString()));
                        }
                        
                        handleManifest.call(this, dependencyManifest, parentPackage, recursive, depth, async);
                    }
                    else {
                        includeCallback.call(thisObj, include, context);
                    }
                };
                
                forEach(options.includes, function(include) {
                    include = packaging.createInclude(include);
                    
                    handleInclude.call(
                        this, 
                        include, 
                        null,
                        options.recursive === true || include.recursive === true, 
                        0,
                        include.isAsync());
                    
                }, this);

                if (options.packages) {
                    forEach(options.packages, function(packageManifest) {
                        handleManifest.call(this, packageManifest, null, options.recursive === true, -1, false);
                    }, this);
                }
            },
            
            /**
             * This method will update a context object to enable the provided extension so that the set of enabled
             * extensions for the context can later be retrieved using  {@link optimizer#getEnabledExtensionsForContext}
             * 
             * This method expects an object that supports a <code>getAttributes()</code> method (typically a {@link templating.Context} object).
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
             * extensions for the context can later be retrieved using  {@link optimizer#getEnabledExtensionsForContext}
             * 
             * This method expects an object that supports a <code>getAttributes()</code> method (typically a {@link templating.Context} object).
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
             * @see {@link optimizer#enableExtensionForContext}
             * @see {@link optimizer#disableExtensionForContext}
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
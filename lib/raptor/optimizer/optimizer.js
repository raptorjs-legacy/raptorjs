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
define('raptor/optimizer', ['raptor'], function (raptor, require, exports, module) {
    'use strict';
    var File = require('raptor/files/File'), packaging = require('raptor/packaging'), Config = require('raptor/optimizer/Config'), PageOptimizer = require('raptor/optimizer/PageOptimizer'), promises = require('raptor/promises'), logger = module.logger(), OptimizerRenderContext = require('raptor/optimizer/OptimizerRenderContext'), CONTEXT_KEY = 'raptor/OptimizerRenderContext';
    var defaultConfig = new Config();
    defaultConfig.setOutputDir(new File(require('raptor/process').cwd(), 'static'));
    defaultConfig.enableExtension('browser');
    var optimizer = {
            defaultConfig: defaultConfig,
            pageOptimizer: null,
            getDefaultConfig: function () {
                return this.defaultConfig;
            },
            getConfig: function () {
                return this.pageOptimizer.getConfig();
            },
            getDefaultPageOptimizer: function () {
                return this.pageOptimizer;
            },
            optimizePage: function (options) {
                return this.pageOptimizer.optimizePage(options);
            },
            configureDefault: function () {
                this.pageOptimizer = new PageOptimizer(defaultConfig);
            },
            configure: function (config, params) {
                var pageOptimizer = this.createPageOptimizer(config, params);
                this.pageOptimizer = pageOptimizer;
            },
            createPageOptimizer: function (config, params) {
                if (!config) {
                    config = defaultConfig;
                } else {
                    if (typeof config === 'string' || config instanceof File || config instanceof require('raptor/resources/Resource')) {
                        config = this.loadConfigXml(config, params);
                    }
                }
                var PageOptimizer = require('raptor/optimizer/PageOptimizer');
                var pageOptimizer = new PageOptimizer(config);
                return pageOptimizer;
            },
            loadConfigXml: function (configFile, params) {
                var Config = require('raptor/optimizer/Config');
                var Resource = require('raptor/resources/Resource');
                var config = new Config(params);
                var configXml;
                var configPath = null;
                if (typeof configFile === 'string') {
                    configFile = new File(configFile);
                }
                if (configFile instanceof File) {
                    configXml = configFile.readAsString('UTF-8');
                    config.setConfigResource(require('raptor/resources').createFileResource(configFile));
                    configPath = configFile.getAbsolutePath();
                } else if (configFile instanceof Resource) {
                    configXml = configFile.readAsString('UTF-8');
                    config.setConfigResource(configFile);
                    configPath = configFile.getURL();
                }
                config.parseXml(configXml, configPath);
                config.notifyPlugins('configLoaded', {
                    config: config,
                    path: configPath
                });
                return config;
            },
            forEachDependency: function (options) {
                var enabledExtensions = options.enabledExtensions, dependencyCallback = options.handleDependency, packageCallback = options.handlePackage, thisObj = options.thisObj, dependencies = options.dependencies, packages = options.packages, context = options.context || {}, _this = this, deferred = promises.defer(), alreadyResolved = promises.defer();
                function done() {
                    deferred.resolve();
                }
                var errorHandled = false;
                alreadyResolved.resolve();
                alreadyResolved = alreadyResolved.promise;
                var foundDependencies = {};
                function handleManifest(manifest, parentPackage, recursive, depth, async, jsSlot, cssSlot) {
                    var foundKey = manifest.getKey() + '|' + async;
                    context.recursive = recursive === true;
                    context.depth = depth;
                    context.async = async === true;
                    context.jsSlot = jsSlot;
                    context.cssSlot = cssSlot;
                    context.parentPackage = parentPackage;
                    var recurseIntoPackage = packageCallback ? packageCallback.call(thisObj, manifest, context) : true;
                    if (recurseIntoPackage === false || foundDependencies[foundKey]) {
                        //Avoid infinite loop by keeping track of which packages we have recursed into
                        return alreadyResolved;
                    }
                    foundDependencies[foundKey] = true;
                    if (recursive === true || depth <= 0) {
                        var promiseChain = null;
                        manifest.forEachDependency(function (type, packageDependency) {
                            function handleCurrentDependency() {
                                return handleDependency(packageDependency, manifest, recursive, depth + 1, async || packageDependency.isAsync(), jsSlot, cssSlot);
                            }
                            if (promiseChain) {
                                promiseChain = promiseChain.then(handleCurrentDependency);
                            } else {
                                promiseChain = handleCurrentDependency();
                            }
                        }, _this, { enabledExtensions: enabledExtensions });
                        if (promiseChain) {
                            return promiseChain;
                        } else {
                            return alreadyResolved;
                        }
                    } else {
                        return alreadyResolved;    // Always return a promise
                    }
                }
                function handleDependency(dependency, parentPackage, recursive, depth, async, jsSlot, cssSlot) {
                    function doHandleManifest(dependencyManifest) {
                        return handleManifest(dependencyManifest, parentPackage, recursive, depth, async, dependency.getJavaScriptSlot() || jsSlot, dependency.getStyleSheetSlot() || cssSlot);
                    }
                    context.recursive = recursive === true;
                    context.depth = depth;
                    context.async = async === true;
                    context.parentPackage = parentPackage;
                    context.jsSlot = jsSlot;
                    context.cssSlot = cssSlot;
                    if (dependency.isPackageDependency()) {
                        var dependencyManifest = dependency.getManifest(context);
                        if (!dependencyManifest) {
                            throw new Error('Dependency manifest not found for package dependency: ' + dependency.toString());
                        }
                        if (promises.isPromise(dependencyManifest)) {
                            return dependencyManifest.then(function (dependencyManifest) {
                                return doHandleManifest(dependencyManifest);
                            });
                        } else {
                            return doHandleManifest(dependencyManifest);
                        }
                    } else {
                        var slot = dependency.getSlot();
                        if (!slot) {
                            if (dependency.getContentType() === 'application/javascript') {
                                slot = jsSlot || 'body';
                            } else {
                                slot = cssSlot || 'head';
                            }
                        }
                        context.slot = slot;
                        dependencyCallback.call(thisObj, dependency, context);
                        return alreadyResolved;
                    }
                }
                function onError(e) {
                    if (errorHandled) {
                        return;
                    }
                    logger.error('Error in forEachDependency. Exception: ' + (e.stack || e));
                    errorHandled = true;
                    deferred.reject(e);
                }
                var i = -1;
                function handleNextDependency() {
                    try {
                        i++;
                        if (i >= dependencies.length) {
                            done();
                            return;
                        }
                        var dependency = packaging.createDependency(dependencies[i]);
                        handleDependency(dependency, null, options.recursive === true || dependency.recursive === true, 0, dependency.isAsync()).then(handleNextDependency).fail(onError);
                    } catch (e) {
                        onError(e);
                    }
                }
                function handleNextPackage() {
                    try {
                        i++;
                        if (i >= packages.length) {
                            done();
                            return;
                        }
                        var packageManifest = packages[i];
                        handleManifest(packageManifest, null, options.recursive === true, -1, false).then(handleNextPackage).fail(onError);
                    } catch (e) {
                        onError(e);
                    }
                }
                try {
                    if (dependencies) {
                        if (!Array.isArray(dependencies)) {
                            dependencies = [dependencies];
                        }
                        handleNextDependency();
                    } else if (packages) {
                        if (!Array.isArray(packages)) {
                            packages = [packages];
                        }
                        handleNextPackage();
                    }
                } catch (e) {
                    onError(e);
                }
                return deferred.promise;
            },
            enableExtensionForContext: function (context, extension) {
                this.getRenderContext(context).enableExtension(extension);
            },
            disableExtensionForContext: function (context, extension) {
                this.getRenderContext(context).disableExtension(extension);
            },
            getEnabledExtensionsForContext: function (context) {
                return this.getRenderContext(context).getEnabledExtensions();
            },
            getRenderContext: function (context) {
                var attributes = context.attributes;
                return attributes[CONTEXT_KEY] || (attributes[CONTEXT_KEY] = new OptimizerRenderContext(context));
            },
            getOptimizerContext: function (context) {
                logger.warn('***DEPRECATED: getOptimizerContext');
                return this.getRenderContext(context);
            }
        };
    //end optimizer
    optimizer.configureDefault();
    return optimizer;
});
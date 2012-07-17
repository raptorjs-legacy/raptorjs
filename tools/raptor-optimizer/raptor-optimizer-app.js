require("../../").createRaptor({
    logging: {
        loggers: {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            "optimizer": {level: "INFO"},
            "raptor-optimizer-app": {level: "INFO"},
            'resources': {level: 'WARN'}
        }
    }
});

var logger = raptor.require('logging').logger('raptor-optimizer-app');




var configArgRegExp=/^--(\w+)(?:=(\w+))?$/
    paramArgRegExp=/^(\w+)(?:=(\w+))?$/,
    cwd = process.cwd(),
    files = raptor.require('files'),
    File = files.File,
    path = require('path'),
    fs = require('fs'),
    packager = raptor.require('packager'),
    strings = raptor.require('strings'),
    pageWatchers = [],
    includeWatchers = [],
    configWatcher = [],
    packageWatchers = [],
    watchedPackages = {},
    closeWatchers = function(watchers) {
        raptor.forEach(watchers, function(w) {
            w.close();
        });
        watchers.splice(0, watchers.length);
    },
    watchPackage = function(manifest) {
        var path = manifest.getSystemPath();
        if (!watchedPackages[path]) {
            var watcher = fs.watch(path, function() {
                raptor.require('packager').removePackageManifestFromCache(manifest);
                logger.info('Package modified: ' + path);
                exports.run();
            });
            packageWatchers.push(watcher);
            watchedPackages[path] = true;
        }
    },
    parseArgs = function(args) {
        var config={};
        args.forEach(function(arg, i) {
            var matches;
            if ((matches = configArgRegExp.exec(arg))) {
                config[matches[1]] = matches[2] || '';
            }
            else if ((matches = paramArgRegExp.exec(arg))) {
                config[matches[1]] = matches[2];
            }
            else {
                config["config-file"] = arg;
            }
        });
        
        return config;
    };
    
var Config = require('./Config.js');



exports.run = function() {
    /*
     * Close all watchers in-case the optimizer is being re-executed
     */
    closeWatchers(includeWatchers);
    closeWatchers(pageWatchers);
    closeWatchers(configWatcher);
    closeWatchers(packageWatchers);
    watchedPackages = {};
    
    var args = parseArgs(process.argv.slice(2));
    
    var config = new Config();
    
    raptor.forEachEntry(args, function(name, value) {
        config.addParam(name, value);
    });
    
    var configFile = args["config-file"];
    
    if (!configFile) {
        
        configFile = files.joinPaths(cwd, 'optimizer-config.xml');
    };
    
    if (!files.exists(configFile)) {
        console.error('Optimizer configuration file not found at location "' + configFile + '". Quitting.');
    }
    
    logger.info('Using optimizer configuration file at location "' + configFile + '"');
    console.log();
    
    config.parseXml(files.readFully(configFile), configFile);
    
    
    ["outputDir",
     "scriptsOutputDir",
     "styleSheetsOutputDir",
     "bundlesOutputDir",
     "pageOutputDir",
     "htmlOutputDir"].forEach(function(dir) {
         if (config[dir]) {
             config[dir] = path.resolve(cwd, config[dir]);
             
             if (config.cleanOutputDirs === true && files.exists(config[dir])) {
                 logger.info("Cleaning directory: " + config[dir]);
                 files.remove(config[dir]);
             }    
         }
     });
    
    config.cleanDirs.forEach(function(dir) {
        if (files.exists(dir)) {
            logger.info("Cleaning directory: " + dir);
            try {
                files.remove(dir);    
            }
            catch(e) {
                logger.warn("Unable to clean directory: " + dir, e);
            }
        }    
     });
    
    console.log();
    
    var leftPad = function(str, len) {
            while (str.length < len) {
                str = " " + str;
            }
            return str;
        },
        padding=24;

    logger.info('Bundler output directories:\n' + 
        leftPad('JavaScript bundles: ', padding) + config.getScriptsOutputDir() + '\n' + 
        leftPad('CSS bundles: ', padding) + config.getStyleSheetsOutputDir() + '\n' +
        leftPad('Pages: ', padding) + config.pageOutputDir + '\n' +
        leftPad('HTML includes: ', padding) + config.getHtmlOutputDir());
    
    var optimizer = raptor.require("optimizer");
    var writer = optimizer.createPageDependenciesFileWriter({
            checksumsEnabled: config.checksumsEnabled !== false,
            scriptsOutputDir: config.getScriptsOutputDir(),
            styleSheetsOutputDir: config.getStyleSheetsOutputDir(),
            htmlOutputDir: config.getHtmlOutputDir(),
            checksumLength: 8
        });
    
    if (config.isWatchIncludesEnabled()) {
        writer.subscribe('bundleWritten', function(eventArgs) {
            var bundle = eventArgs.bundle,
                outputPath = eventArgs.file.getAbsolutePath();
            
            if (!bundle.watching && bundle.sourceResource && !bundle.inPlaceDeployment) {
                
                var watcher = fs.watch(bundle.sourceResource.getSystemPath(), function() {
                    logger.info('Include modified: ' + bundle.sourceResource.getSystemPath());
                    writer.rewriteBundle(outputPath, bundle);
                });
                
                bundle.watching = true;
                includeWatchers.push(watcher);
            }
            eventArgs = null;
        });
    }

    if (config.minifyJs === true) {
        writer.addFilter('optimizer.MinifyJSFilter');
    }
    
    var urlBuilder = optimizer.createSimpleUrlBuilder({
            scriptsDir: config.getScriptsOutputDir(),
            styleSheetsDir: config.getStyleSheetsOutputDir(),
            prefix: config.urlPrefix,
            scriptsPrefix: config.scriptsUrlPrefix,
            styleSheetsPrefix: config.styleSheetsUrlPrefix
        });
    
    writer.setUrlBuilder(urlBuilder);
    writer.context.raptorConfig = config.raptorConfigJSON;
    
    raptor.require('resources').getSearchPath().addDir(cwd);
    
   
    require('./page-finder.js').findPages(config);
    
    config.forEachPage(function(page) {
        console.log();
        logger.info('Building bundles for page "' + page.name + '"...');
        var bundleSetDef = page.getBundleSetDef(),
            enabledExtensions = page.getEnabledExtensions(),
            bundleSet = config.createBundleSet(bundleSetDef, enabledExtensions),
            pageDependencies,
            pagePath,
            packagePath = page.packagePath,
            outputPagePath;

        
        
        if (packagePath) {
            packagePath = path.resolve(cwd, packagePath);
            
            var packageResource = raptor.require("resources").createFileResource(packagePath);
            var manifest = packager.getPackageManifest(packageResource);
            
            manifest.forEachInclude(
                function(type, pageInclude) {
                    page.addInclude(pageInclude);
                },
                this,
                {
                    enabledExtensions: config.getEnabledExtensions()
                });
        }
        pageDependencies = optimizer.buildPageDependencies({
            inPlaceDeploymentEnabled: config.inPlaceDeploymentEnabled,
            pageName: page.name,
            includes: page.includes,
            bundleSet: bundleSet,
            enabledExtensions: enabledExtensions
        });
            
        if (config.isWatchPackagesEnabled()) {
            pageDependencies.getPackageManifests().forEach(watchPackage);
        }
        
        var oldWrite,
            injector,
            injects = [];
        
        urlBuilder.pageDir = null; //Reset out the page output directory for the URL builder  
        
        if (page.htmlPath && config.injectHtmlIncludes) {
            pagePath = path.resolve(cwd, page.htmlPath);
            
            if (config.modifyPages === false) {

                if (page.basePath) {
                    outputPagePath = path.join(config.pageOutputDir, pagePath.substring(page.basePath.length));
                }
                else {
                    outputPagePath = path.join(config.pageOutputDir, new File(pagePath).getName());    
                }
            }
            else {
                outputPagePath = pagePath;
            }
            
            urlBuilder.pageDir = new File(outputPagePath).getParent();
            
            oldWrite = writer.writePageIncludeHtml;

            writer.writePageIncludeHtml = function(pageName, location, html) {
                injects.push({location: location, html: html});
            };
        }
        
        console.log();
        logger.info('Writing dependencies for page "' + page.name + '"...');
        writer.writePageDependencies(pageDependencies);
        
        if (injects.length) {
            var injectPageDependencies = function() {
                injector = require('./injector').createInjector(files.readFully(pagePath), pagePath, config.keepHtmlMarkers !== false);
                
                injects.forEach(function(inject) {
                    injector.inject(inject.location, inject.html);
                });
                
                var pageHtml = injector.getHtml();
                
                logger.info('Writing page to "' + outputPagePath + '"...');
                var outputPageFile = new File(outputPagePath);
                outputPageFile.writeFully(pageHtml);
            };
            
            injectPageDependencies();
            
            if (config.isWatchPagesEnabled()) {
                var watcher = require('fs').watch(pagePath, function() {
                    logger.info('Page modified: ' + pagePath);
                    injectPageDependencies();
                });
                
                pageWatchers.push(watcher);
            }
            
        }
        if (oldWrite) {
            writer.writePageIncludeHtml = oldWrite;    
        }
        
    });
    
    console.log();
    logger.info('Optimization complete!');
    
    if (config.isWatchConfigEnabled()) {
        var watcher = fs.watch(configFile, function() {
            exports.run();
        });
        configWatcher.push(watcher);
    }
    
    if (pageWatchers.length || includeWatchers.length || configWatcher.length || packageWatchers.length) {
        console.log();
        if (pageWatchers.length) {
            logger.info("Watching page HTML files for changes");    
        }
        if (includeWatchers.length) {
            logger.info("Watching includes for changes");    
        }
        if (configWatcher.length) {
            logger.info("Watching configuration file for changes");    
        }
        if (packageWatchers.length) {
            logger.info("Watching packages for changes");    
        }
    }
}
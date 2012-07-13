require("raptorjs").createRaptor({
    logging: {
        loggers: {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            "optimizer": {level: "INFO"},
            'resources': {level: 'WARN'}
        }
    }
});




var configArgRegExp=/^--(\w+)(?:=(\w+))?$/
    paramArgRegExp=/^(\w+)(?:=(\w+))?$/,
    cwd = process.cwd(),
    files = raptor.require('files'),
    path = require('path'),
    fs = require('fs'),
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


exports.run = function(args) {
    var configFilePath = null;
    var args = parseArgs(process.argv.slice(1));
    
    var config = new Config();
    
    raptor.forEachEntry(args, function(name, value) {
        config.addParam(name, value);
    });
    
    var configFile = args["config-file"];
    if (!configFile) {
        configFile = files.joinPaths(cwd, 'optimizer-config.xml');
    };
    
    if (!files.exists(configFile)) {
        console.error('Bundler configuration file not found at location "' + configFile + '". Quitting.');
    }
    
    console.log('Using optimizer configuration file at location "' + configFile + '"\n');
    
    config.parseXml(files.readFully(configFile), configFile);
    
    
    ["outputDir",
     "scriptsOutputDir",
     "styleSheetsOutputDir",
     "htmlOutputDir"].forEach(function(dir) {
         if (config[dir]) {
             config[dir] = path.resolve(cwd, config[dir]);
             
             if (config.cleanOutputDirs === true && files.exists(config[dir])) {
                 console.log("Cleaning directory: " + config[dir]);
                 files.remove(config[dir]);
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

    console.log('Bundler output directories:\n' + 
        leftPad('JavaScript bundles: ', padding) + config.getScriptsOutputDir() + '\n' + 
        leftPad('CSS bundles: ', padding) + config.getStyleSheetsOutputDir() + '\n' + 
        leftPad('HTML includes: ', padding) + config.getHtmlOutputDir() + '\n');
    
    var optimizer = raptor.require("optimizer");
    var writer = optimizer.createPageDependenciesFileWriter({
            scriptsOutputDir: config.getScriptsOutputDir(),
            styleSheetsOutputDir: config.getStyleSheetsOutputDir(),
            htmlOutputDir: config.getHtmlOutputDir(),
            checksumLength: 8
        });

    if (config.minifyJs === true) {
        writer.addFilter(function(code, contentType) {
            if (contentType === 'application/javascript') {
                return raptor.require("js-minifier").minify(code);
            }
            else {
                return code;
            }
        });
    }
    
    writer.setUrlBuilder(optimizer.createSimpleUrlBuilder({
            prefix: config.urlPrefix,
            scriptsPrefix: config.scriptsUrlPrefix,
            styleSheetsPrefix: config.styleSheetsUrlPrefix
        }));
    
    raptor.require('resources').getSearchPath().addDir(cwd);
    
   
    
    config.forEachPage(function(page) {
        var bundleSetDef = page.getBundleSetDef(),
            enabledExtensions = page.getEnabledExtensions(),
            bundleSet = config.createBundleSet(bundleSetDef, enabledExtensions),
            pageDependencies = optimizer.buildPageDependencies({
                pageName: page.name,
                includes: page.includes,
                bundleSet: bundleSet,
                enabledExtensions: enabledExtensions
            });
            
        var oldWrite,
            injector,
            pagePath;
        
        if (page.path && config.injectHtmlIncludes) {
            oldWrite = writer.writePageIncludeHtml;
            pagePath = path.resolve(cwd, page.path);
            injector = require('./injector').createInjector(files.readFully(pagePath), pagePath);
            
            writer.writePageIncludeHtml = function(pageName, location, html) {
                injector.inject(location, html);
            };
        }
        
        writer.writePageDependencies(pageDependencies);
        
        if (injector) {
            var pageHtml = injector.getHtml();
            files.writeFully(pagePath, pageHtml);
        }
        writer.writePageIncludeHtml = oldWrite;
    });
    
    console.log('\Optimization complete!');
    
}
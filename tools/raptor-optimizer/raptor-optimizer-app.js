
require("raptor").createRaptor({
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

var files = raptor.require('files'),
    logger = raptor.require('logging').logger('raptor-optimizer-app'),
    configArgRegExp=/^--(\w+)(?:=(\w+))?$/,
    paramArgRegExp=/^(\w+)(?:=(\w+))?$/,
    cwd = process.cwd(),
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
    },
    fileWatcher = raptor.require('file-watcher'),
    params = parseArgs(process.argv.slice(2)),
    configFile = params["config-file"];

if (!configFile) {    
    configFile = files.joinPaths(cwd, 'optimizer-config.xml');
}
    
exports.run = function() {
    if (!files.exists(configFile)) {
        console.error('Optimizer configuration file not found at location "' + configFile + '". Quitting.');
    }

    logger.info('Using optimizer configuration file at location "' + configFile + '"');
    
    console.log();

    var optimizer;
    
    //raptor.require('resources').getSearchPath().addDir(files.resolvePath(cwd, '.'));
    
    var originalSearchPath = raptor.require('resources').getSearchPath().clone();
    
    var run = function() {
        raptor.require('resources').setSearchPath(originalSearchPath);
        
        if (optimizer) {
            optimizer.closeWatchers();
        }
        
        try
        {
            optimizer = raptor.require('optimizer').createOptimizer(configFile, params);
            console.log("Resource search path:");
            raptor.require('resources').getSearchPath().forEachEntry(function(entry) {
                console.log(entry.toString());
            });
            
            optimizer.cleanDirs();
            optimizer.writeAllPages();
            
            optimizer.subscribe({
                "configReloaded": function() {
                    run();
                },
                "packageModified": function(eventArgs) {
                    run();
                }
            }, this);
            
            if (optimizer.hasWatchers() || optimizer.getConfig().isWatchConfigEnabled()) {
                console.log();
                if (optimizer.hasWatchers('pages')) {
                    logger.info("Watching pages for changes");    
                }
                if (optimizer.hasWatchers('includes')) {
                    logger.info("Watching includes for changes");    
                }
                if (optimizer.getConfig().isWatchConfigEnabled()) {
                    logger.info("Watching configuration file for changes");    
                }
                if (optimizer.hasWatchers('packages')) {
                    logger.info("Watching packages for changes");    
                }
                if (optimizer.hasWatchers('dir')) {
                    logger.info("Watching directories for changes");    
                }
            }
        }
        catch(e) {
            logger.error("An error occurred while optimizing application. Exception: " + e, e);
        }
    };
    run();
    
    
    
};

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
    
    var run = function() {
        if (optimizer) {
            optimizer.closeWatchers();
        }
        
        optimizer = raptor.require('optimizer').createOptimizer(configFile, params);
        
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
                logger.info("Watching page HTML files for changes");    
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
        }
    };
    run();
    
    
    
};

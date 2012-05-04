require("raptor").createRaptor({
    logging: {
        loggers: GLOBAL.raptorLoggingConfig || {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            'resources': {level: 'WARN'}
        }
    },
    packaging: {
        enabledExtensions: ['logging.console']
    }
});

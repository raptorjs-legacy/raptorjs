window.raptor = raptorBuilder.createRaptor({
    logging: {
        loggers: {
            'ROOT': {level: 'DEBUG'},
            'oop-server': {level: 'WARN'},
            'resources': {level: 'WARN'}
        }
    }
});
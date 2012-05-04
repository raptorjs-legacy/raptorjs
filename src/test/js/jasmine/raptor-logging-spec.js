describe('logging module', function() {

    before(function() {
        createRaptor({
            'logging': {
                loggers: {
                    'ROOT': {level: 'ERROR'},
                    'TestLoggingObject.test1': {level: 'DEBUG'},
                    'TestLoggingObject': {level: 'WARN'},
                    'TestLoggingObject.test22': {level: 'INFO'}
                }
            }
        });
    });
    
    it('should allow any object to become a logger', function() {
        
        var obj = {};
        raptor.logging.makeLogger(obj, 'TestLoggingObject');
        expect(obj.error).toNotEqual(undefined);
        var error = null;
        try {
            obj.error('Test debug');
        }
        catch(e) {
            error = e;
        }
        expect(error).toEqual(null);        
     });
    
    it('should handle logger prefixes correctly', function() {
        
        var logLevels = raptor.logging.levels;
        
        var loggerConfigs = raptor.logging.getLoggerConfigs();
        expect(loggerConfigs.length).toEqual(4);
        expect(loggerConfigs[0].prefix).toEqual('TestLoggingObject.test22');
        expect(loggerConfigs[0].level).toEqual(logLevels.INFO);
        expect(loggerConfigs[1].prefix).toEqual('TestLoggingObject.test1');
        expect(loggerConfigs[1].level).toEqual(logLevels.DEBUG);
        expect(loggerConfigs[2].prefix).toEqual('TestLoggingObject');
        expect(loggerConfigs[2].level).toEqual(logLevels.WARN);
        expect(loggerConfigs[3].prefix).toEqual('ROOT');
        expect(loggerConfigs[3].level).toEqual(logLevels.ERROR);
        
        //console.log("Logging configs:");
        //console.log(loggerConfigs);
        
        expect(raptor.logging.getLogLevel('Test')).toEqual(logLevels.ERROR);
        expect(raptor.logging.getLogLevel('TestLoggingObject')).toEqual(logLevels.WARN);
        expect(raptor.logging.getLogLevel('TestLoggingObject.test1')).toEqual(logLevels.DEBUG);
        expect(raptor.logging.getLogLevel('TestLoggingObject.test22')).toEqual(logLevels.INFO);
     });
});
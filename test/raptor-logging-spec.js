require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('logging module', function() {

    beforeEach(function() {
        require('raptor/logging').configure({
            loggers: {
                'ROOT': {level: 'ERROR'},
                'TestLoggingObject.test1': {level: 'DEBUG'},
                'TestLoggingObject': {level: 'WARN'},
                'TestLoggingObject.test22': {level: 'INFO'}
            }
        });
    });
    
    it('should handle logger prefixes correctly', function() {
        
        var LogLevel = require('raptor/logging').LogLevel;
        
        var loggerConfigs = require('raptor/logging').getLoggerConfigs();

        expect(loggerConfigs.length).toEqual(4);
        expect(loggerConfigs[0].loggerName).toEqual('TestLoggingObject/test22');
        expect(loggerConfigs[0].logLevel).toEqual(LogLevel.INFO);
        expect(loggerConfigs[1].loggerName).toEqual('TestLoggingObject/test1');
        expect(loggerConfigs[1].logLevel).toEqual(LogLevel.DEBUG);
        expect(loggerConfigs[2].loggerName).toEqual('TestLoggingObject');
        expect(loggerConfigs[2].logLevel).toEqual(LogLevel.WARN);
        expect(loggerConfigs[3].loggerName).toEqual('ROOT');
        expect(loggerConfigs[3].logLevel).toEqual(LogLevel.ERROR);
        
        //console.log("Logging configs:");
        //console.log(loggerConfigs);
        
        expect(require('raptor/logging').getLoggerConfig('Test').logLevel).toEqual(LogLevel.ERROR);
        expect(require('raptor/logging').getLoggerConfig('TestLoggingObject').logLevel).toEqual(LogLevel.WARN);
        expect(require('raptor/logging').getLoggerConfig('TestLoggingObject/test1').logLevel).toEqual(LogLevel.DEBUG);
        expect(require('raptor/logging').getLoggerConfig('TestLoggingObject/test22').logLevel).toEqual(LogLevel.INFO);
     });
});
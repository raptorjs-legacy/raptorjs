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
    
    it('should allow any object to become a logger', function() {
        
        var obj = {};
        require('raptor/logging').makeLogger(obj, 'TestLoggingObject');
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
        
        var logLevels = require('raptor/logging').levels;
        
        var loggerConfigs = require('raptor/logging').getLoggerConfigs();

        expect(loggerConfigs.length).toEqual(4);
        expect(loggerConfigs[0].prefix).toEqual('TestLoggingObject/test22');
        expect(loggerConfigs[0].level).toEqual(logLevels.INFO);
        expect(loggerConfigs[1].prefix).toEqual('TestLoggingObject/test1');
        expect(loggerConfigs[1].level).toEqual(logLevels.DEBUG);
        expect(loggerConfigs[2].prefix).toEqual('TestLoggingObject');
        expect(loggerConfigs[2].level).toEqual(logLevels.WARN);
        expect(loggerConfigs[3].prefix).toEqual('ROOT');
        expect(loggerConfigs[3].level).toEqual(logLevels.ERROR);
        
        //console.log("Logging configs:");
        //console.log(loggerConfigs);
        
        expect(require('raptor/logging').getLogLevel('Test')).toEqual(logLevels.ERROR);
        expect(require('raptor/logging').getLogLevel('TestLoggingObject')).toEqual(logLevels.WARN);
        expect(require('raptor/logging').getLogLevel('TestLoggingObject/test1')).toEqual(logLevels.DEBUG);
        expect(require('raptor/logging').getLogLevel('TestLoggingObject/test22')).toEqual(logLevels.INFO);
     });
});
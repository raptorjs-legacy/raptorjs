if( !process.env.NODE_ENV ) process.env.NODE_ENV = 'test';
var path = require('path');
var fs   = require('fs');


require("raptor").createRaptor({
    logging: {
        loggers: {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            "optimizer": {level: "INFO"},
            "optimizer.cli": {level: "INFO"},
            'resources': {level: 'WARN'}
        }
    }
});

raptor.require('optimizer.cli').run(process.argv);
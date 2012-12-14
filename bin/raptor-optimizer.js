if( !process.env.NODE_ENV ) process.env.NODE_ENV = 'test';
var path = require('path');
var fs   = require('fs');

require('raptor');

require('raptor/logging').configure({
    loggers: {
        'ROOT': {level: 'WARN'},
        "raptor/optimizer": {level: "INFO"},
        "raptor/optimizer/cli": {level: "INFO"},
    }
});

require('raptor/optimizer/cli').run(process.argv);
var raptor = require('raptor');

require('raptor/logging').configure({
    loggers: {
        'ROOT': {level: 'WARN'},
        "raptor/cli": {level: "INFO"}
    }
});

var files = require('raptor/files'),
    File = require('raptor/files/File'),
    resources = require('raptor/resources'),
    Scaffolding = require('./Scaffolding'),
    console = require('colorize').console;

resources.addSearchPathDir(__dirname);

function log(message) {
    console.log(message);
}

function _log(color, label, message, isError) {
    while(label.length<10) {
        label = ' ' + label;
    }
    var output = '#' + color + '[' + label + '] ' + message;

    if (isError) {
        console.error(output);    
    }
    else {
        console.log(output);
    }
    
}

function logSuccess(label, message) {
    _log('green', label, message);
}

function logWarn(label, message) {
    _log('yellow', label, message);
}

function logError(label, message) {
    _log('red', label, message, true);
}

var cli = {
    log: log,
    logSuccess: logSuccess,
    logWarn: logWarn,
    logError: logError
}

var scaffolding = new Scaffolding(cli);
cli.generate = scaffolding.generate.bind(scaffolding);

function getUserHome() {
    return new File(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']);
}

function loadConfig() {
    var configDirs = [];
    var curDir = new File(process.cwd());
    while(true) {
        configDirs.push(curDir);
        curDir = curDir.getParentFile();
        if (!curDir || !curDir.exists()) {
            break;
        }
    }

    configDirs.push(getUserHome());
    configDirs.push(new File(__dirname));

    var config = {};

    for (var i=configDirs.length-1; i>=0; i--) {
        var dir = configDirs[i];
        var configFile = new File(dir, '.raptor');
        if (configFile.exists() && configFile.isFile()) {
            var curConfig = JSON.parse(configFile.readAsString());

            // Resolve relative file paths and directories
            raptor.forEachEntry(curConfig, function(key, value) {

                if (key.endsWith('.dir') || key.endsWith('.file')) {
                    value = files.resolvePath(dir.getAbsolutePath(), value);
                }

                config[key] = value;
            });
        }
    };

    return config;
};

var args = process.argv.slice(2);
var commandArgs = [], 
    optionArgs = [],
    config = loadConfig();

//console.error('CONFIG: ', config);
/*
 * Separate out option args from the command
 */
args.forEach(function(arg) {
    if (arg.startsWith('-')) {
        optionArgs.push(arg);
    }
    else {
        commandArgs.push(arg);
    }
});

var validCommand = false;

for (var i=commandArgs.length-1; i>=0; i--) {
    var commandFile = config['command.' + commandArgs.slice(0, i+1).join(' ') + '.file'];
    if (!commandFile) {
        continue;
    }

    validCommand = true;

    var commandFunc = require(commandFile);
    
    if (commandFunc && typeof commandFunc === 'function') {
        if (i<commandArgs.length-1) {
            optionArgs = commandArgs.slice(i+1).concat(optionArgs);
        }
        commandFunc(optionArgs, config, cli);
        break;
    }
    else {
        console.error('Invalid command in file "' + commandFile + '". Function expected');
    }
} 

if (!validCommand) {
    console.error('Unsupported command: ' + commandArgs.join(' '));
}
    

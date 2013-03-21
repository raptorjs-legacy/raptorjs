var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path');

module.exports = function(args, config) {
    var appName = 'webapp',
        isStatic = false,
        outputDir;

    require('optimist')(args)
        .usage('Usage: $0 create webapp [app-name] [options]\n')
        .check(function(argv) {
            appName = argv._[0];
            if (!appName) {
                outputDir = path.join(process.cwd());
                appName = new File(process.cwd()).getName();
            }
            else {
                outputDir = path.join(process.cwd(), appName);
            }
            
            isStatic = argv['static'] === true;
        })
        .argv; 

    var scaffoldDir = config["scaffold.webapp.dir"];
    if (!scaffoldDir) {
        console.error('"scaffold.webapp.dir" not defined in raptor config file');
        return;
    }

    scaffoldDir = new File(scaffoldDir);
    if (!scaffoldDir.exists()) {
        console.error('Invalid value for "scaffold.webapp.dir". The directory at path "' + scaffoldDir.getAbsolutePath() + '" does not exist.');
        return;
    }

    

    require('./scaffolding').generate(
        {
            scaffoldDir: scaffoldDir,
            outputDir: outputDir,
            viewModel: {
                appName: appName,
                ifStatic: isStatic,
                ifDynamic: !isStatic
            },
            afterFile: function(outputFile) {
                
            }
        });
    
    console.log('Webapp written to "' + outputDir + '"');
};

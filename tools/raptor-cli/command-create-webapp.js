var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path');

module.exports = function(args, config, cli) {
    var appName = 'webapp',
        isStatic = false,
        ifTesting = true,
        outputDir;

    require('optimist')(args)
        .usage('Usage: $0 create webapp [app-name] [options]\n')
        .boolean('static')
        .describe('static', 'Generate a static, server-less web application')
        .boolean('no-testing')
        .describe('no-testing', 'Do not generate code related to testing')
        .describe('help', 'Show this message')
        .check(function(argv) {
            if (argv.help) {
                throw '';
            }
            
            appName = argv._[0];
            if (!appName) {
                outputDir = path.join(process.cwd());
                appName = new File(process.cwd()).getName();
            }
            else {
                outputDir = path.join(process.cwd(), appName);
            }
            
            if (argv.testing === false) {
                ifTesting = false;
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

    

    cli.generate(
        {
            scaffoldDir: scaffoldDir,
            outputDir: outputDir,
            viewModel: {
                appName: appName,
                ifStatic: isStatic,
                ifDynamic: !isStatic,
                webappType: isStatic ? 'static' : 'dynamic',
                ifTesting: ifTesting
            },
            afterFile: function(outputFile) {
                
            }
        });
    cli.logSuccess('finished', 'Webapp written to "' + outputDir + '"');
    cli.log('\nAll that is left is to run the following command:\n#cyan[npm install]');
    if (isStatic) {
        cli.log('\nAnd then build your static website using the following command:\n#cyan[node build.js]');
    }
};

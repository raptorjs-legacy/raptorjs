var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path');

module.exports = function(args, config) {
    var longName = null;

    require('optimist')(args)
        .usage('Usage: $0 create page <page-name> [options]\n')
        .check(function(argv) {
            longName = argv._[0];
            if (!longName) {
                throw 'Page name is required';
            }
        })
        .argv; 

    var scaffoldDir = config["scaffold.page.dir"];
    if (!scaffoldDir) {
        console.error('"scaffold.page.dir" not defined in raptor config file');
        return;
    }

    scaffoldDir = new File(scaffoldDir);
    if (!scaffoldDir.exists()) {
        console.error('Invalid value for "scaffold.page.dir". The directory at path "' + scaffoldDir.getAbsolutePath() + '" does not exist.');
        return;
    }

    var lastSlash = longName.lastIndexOf('/'),
        shortName = lastSlash === -1 ? longName : longName.slice(lastSlash+1),
        shortNameLower = shortName.toLowerCase(),
        shortNameDashSeparated = shortName.replace(/([a-z])([A-Z])/g, function(match, a, b) {
            return a + '-' + b;
        }).toLowerCase(),
        longNameDashSeparated = shortName.replace(/[^a-zA-Z0-9]/g, '-'),
        dirPath = longName,
        baseDir = config['pages.base.dir'] || process.cwd(),
        outputDir = path.join(baseDir, dirPath);

    require('./scaffolding').generate(
        {
            scaffoldDir: scaffoldDir,
            outputDir: outputDir,
            viewModel: {
                longName: longName,
                longNameDashSeparated: longNameDashSeparated,
                shortName: shortName,
                shortNameLower: shortNameLower,
                shortNameDashSeparated: shortNameDashSeparated
            },
            afterFile: function(outputFile) {
                
            }
        });
    
    console.log('Page written to "' + outputDir + '"');
};

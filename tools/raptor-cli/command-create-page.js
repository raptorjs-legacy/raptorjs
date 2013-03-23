var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path');

module.exports = function(args, config, cli) {
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
        cli.logError('error', 'Invalid value for "scaffold.page.dir". The directory at path "' + scaffoldDir.getAbsolutePath() + '" does not exist.');
        return;
    }

    var pagePath = longName;

    if (longName.startsWith('/')) {
        longName = longName.substring(1);
    }
    else {
        pagePath = '/' + pagePath;
    }

    function dashSeparate(str) {
        return str.replace(/([a-z])([A-Z])/g, function(match, a, b) {
            return a + '-' + b;
        }).toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    }


    var isStatic = config['webapp.type'] === 'static';
    var baseDir = config['pages.base.dir'] || process.cwd();
    var outputDir = longName ? path.join(baseDir, longName) : baseDir;

    if (!longName) {
        longName = 'index';
    }



    var lastSlash = longName.lastIndexOf('/'),
        shortName = lastSlash === -1 ? longName : longName.slice(lastSlash+1),
        shortNameLower = shortName.toLowerCase(),
        shortNameDashSeparated = dashSeparate(shortName),
        longNameDashSeparated = dashSeparate(longName),
        dirPath = longName;

    var viewModel = {
            longName: longName,
            longNameDashSeparated: longNameDashSeparated,
            shortName: shortName,
            shortNameLower: shortNameLower,
            shortNameDashSeparated: shortNameDashSeparated
        };

    cli.generate(
        {
            scaffoldDir: scaffoldDir,
            outputDir: outputDir,
            viewModel: viewModel,
            afterFile: function(outputFile) {
                
            }
        });



    cli.logSuccess('finished', 'Page written to "' + outputDir + '"');

    var isStatic = config['webapp.type'] === 'static';

    if (isStatic) {
        cli.log('\nTo build page:\n#cyan[node build.js ' + pagePath + ']');
    }
};

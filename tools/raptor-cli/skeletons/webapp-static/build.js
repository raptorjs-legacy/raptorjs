require('raptor');

var isDev,
    page;

var argv = require('optimist')(process.argv.slice(2))
    .usage('Usage: $0 \n[options]\n')
    .boolean('dev')
    .describe('dev', 'Enable the development profile for the optimizer')
    .check(function(argv) {
        if (argv._.length) {
            page = argv._[0];
        }
        isDev = argv['dev'] === true;
    })
    .argv; 

var templating = require('raptor/templating'),
    files = require('raptor/files'),
    resources = require('raptor/resources'),
    path = require('path'),
    modulesDir = path.join(__dirname, 'modules');

require('raptor/optimizer').configure(
    path.join(__dirname, "optimizer-config.xml"), 
    {
        profile: isDev ? 'development' : 'production'
    });

resources.addSearchPathDir(modulesDir);
require('raptor/templating/compiler').setWorkDir(path.join(__dirname, "work"));

try
{

    var publisher = require('./publisher').createPublisher({
        pagesDir: path.join(__dirname, 'modules/pages'),
        modulesDir: modulesDir,
        outputDir: path.join(__dirname, 'build'),
        urlsIncludeFilename: isDev
    });

    if (page) {
        publisher.publishPage(page);
    }
    else {
        publisher.publishAllPages();
    }
    
}
catch(e) {
    require('raptor/logging').logger('build').error(e);
}



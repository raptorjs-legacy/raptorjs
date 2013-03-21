var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path'),
    dust = require('dustjs-linkedin');

dust.optimizers.format = function(ctx, node) { return node };

var isStatic = false;

module.exports = function(args, config) {

    var appName;

    var argv = require('optimist')(args)
        .usage('Usage: $0 create webapp [app-name] [options]\n')
        .boolean('static')
        .describe('static', 'Generate a server-less, static HTML app')
        .check(function(argv) {
            appName = argv._[0];
            if (!appName) {
                appName = new File(process.cwd()).getParentFile().getName();
            }

            isStatic = argv['static'] === true;
        })
        .argv;

    var dirKey = isStatic ? "skeleton.static-webapp.dir" : "skeleton.dynamic-webapp.dir";

    var skeletonDir = config[dirKey];
    if (!skeletonDir) {
        console.error('"' + dirKey + '" not defined in raptor config file');
        return;
    }

    skeletonDir = new File(skeletonDir);
    if (!skeletonDir.exists()) {
        console.error('Invalid value for "' + dirKey + '". The directory at path "' + skeletonDir.getAbsolutePath() + '" does not exist.');
        return;
    }

    var baseDir = process.cwd();

    require('raptor/files/walker').walk(
        skeletonDir, 
        function(file) {
            if (file.isDirectory() || file.getAbsolutePath() === skeletonDir.getAbsolutePath()) {
                return;
            }

            var inputTemplate = file.readAsString();
            var templateName = file.getName();
            
            var outputPath = file.getAbsolutePath().slice(skeletonDir.getAbsolutePath().length + 1);
            var outputFile = new File(
                path.join(
                    baseDir, 
                    outputPath));

            if (outputFile.exists()) {
                console.log('Output file "' + outputFile.getAbsolutePath() + '" already exists. Skipping...');
                return;
            }

            console.log('Writing ' + outputFile.getAbsolutePath() + '...');

            var compiled = dust.compile(inputTemplate, templateName, false);
            dust.loadSource(compiled);

            dust.render(
                templateName, 
                {
                    appName: appName
                }, 
                function(err, out) {
                    
                    outputFile.writeAsString(out);
                });
            
        },
        this);

    console.log('Webapp written to "' + baseDir + '"');
}
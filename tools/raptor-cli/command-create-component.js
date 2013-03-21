var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path'),
    dust = require('dustjs-linkedin');

dust.optimizers.format = function(ctx, node) { return node };

module.exports = function(args, config) {
    var longName;

    var argv = require('optimist')(args)
        .usage('Usage: $0 create component <component-name> [options]\n')
        .boolean('no-widget')
        .describe('no-widget', 'Do not generate a widget')
        .check(function(argv) {
            longName = argv._[0];
            if (!longName) {
                throw 'Component name is required';
            }
        })
        .argv; 

    var skeletonDir = config["skeleton.component.dir"];
    if (!skeletonDir) {
        console.error('"skeleton.component.dir" not defined in raptor config file');
        return;
    }

    skeletonDir = new File(skeletonDir);
    if (!skeletonDir.exists()) {
        console.error('Invalid value for "skeleton.component.dir". The directory at path "' + skeletonDir.getAbsolutePath() + '" does not exist.');
        return;
    }

    var lastSlash = longName.lastIndexOf('/'),
        shortName = lastSlash === -1 ? longName : longName.slice(lastSlash+1),
        shortNameLower = shortName.toLowerCase(),
        dirPath = longName,
        baseDir = config['components.base.dir'] || process.cwd();

    require('raptor/files/walker').walk(
        skeletonDir, 
        function(file) {
            if (file.isDirectory() || file.getAbsolutePath() === skeletonDir.getAbsolutePath()) {
                return;
            }

            var inputTemplate = file.readAsString();
            var templateName = file.getName();
            var compiled = dust.compile(inputTemplate, templateName, false);
            
            dust.loadSource(compiled);

            var outputPath = file.getAbsolutePath().slice(skeletonDir.getAbsolutePath().length + 1);
            var outputFile = new File(
                path.join(
                    baseDir, 
                    dirPath, 
                    outputPath.replace(/Skeleton/g, shortName).replace(/skeleton/g, shortNameLower)));

            if (outputFile.exists()) {
                console.log('Output file "' + outputFile.getAbsolutePath() + '" already exists. Skipping...');
                return;
            }

            var shortNameDashSeparated = shortName.replace(/([a-z])([A-Z])/g, function(match, a, b) {
                return a + '-' + b;
            }).toLowerCase();
            
            dust.render(
                templateName, 
                {
                    longName: longName,
                    shortName: shortName,
                    shortNameLower: shortNameLower,
                    shortNameDashSeparated: shortNameDashSeparated
                }, 
                function(err, out) {
                    console.log('Writing ' + outputFile.getAbsolutePath() + '...');
                    outputFile.writeAsString(out);
                });

            // Register RTLD files in the app.rtld file
            if (outputFile.getExtension() === 'rtld') {
                var appRtldPath = config["app.rtld.file"];
                var modulesDir = config["modules.dir"];

                if (appRtldPath && modulesDir) {
                    var appRtldFile = new File(appRtldPath);
                    var rtldXml = appRtldFile.readAsString();
                    var componentRtldPath = outputFile.getAbsolutePath().slice(modulesDir.length);
                    var newTaglibElement = '<import-taglib path="' + componentRtldPath + '"/>';
                    if (rtldXml.indexOf(newTaglibElement) === -1) {
                        console.log('Adding ' + newTaglibElement + ' to "' + appRtldFile.getAbsolutePath() + '"...');
                        rtldXml = rtldXml.replace('</raptor-taglib>', '    ' + newTaglibElement  + '\n</raptor-taglib>');
                        appRtldFile.writeAsString(rtldXml);
                    }
                }
            }
        },
        this);
    console.log('UI component written to "' + path.join(baseDir, dirPath) + '"');
}
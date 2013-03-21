var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path'),
    dust = require('dustjs-linkedin');

dust.optimizers.format = function(ctx, node) { return node };

module.exports = function(args, config) {

    var longName;

    var argv = require('optimist')(args)
        .usage('Usage: $0 create page <page-name> [options]\n')
        .boolean('no-widget')
        .describe('no-widget', 'Do not generate a widget')
        .check(function(argv) {
            longName = argv._[0];
            if (!longName) {
                throw 'Page name is required';
            }
        })
        .argv; 

    var skeletonDir = config["skeleton.page.dir"];
    if (!skeletonDir) {
        console.error('"skeleton.page.dir" not defined in raptor config file');
        return;
    }

    skeletonDir = new File(skeletonDir);
    if (!skeletonDir.exists()) {
        console.error('Invalid value for "skeleton.page.dir". The directory at path "' + skeletonDir.getAbsolutePath() + '" does not exist.');
        return;
    }

    var lastSlash = longName.lastIndexOf('/'),
        shortName = lastSlash === -1 ? longName : longName.slice(lastSlash+1),
        shortNameLower = shortName.toLowerCase(),
        dirPath = longName,
        baseDir = config['pages.base.dir'] || process.cwd();

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
            
            var longNameDashSeparated = shortName.replace(/[^a-zA-Z0-9]/g, '-');

            dust.render(
                templateName, 
                {
                    longName: longName,
                    longNameDashSeparated: longNameDashSeparated,
                    shortName: shortName,
                    shortNameLower: shortNameLower,
                    shortNameDashSeparated: shortNameDashSeparated
                }, 
                function(err, out) {
                    console.log('Writing ' + outputFile.getAbsolutePath() + '...');
                    outputFile.writeAsString(out);
                });
            
        },
        this);

    console.log('Page written to "' + path.join(baseDir, dirPath) + '"');

}
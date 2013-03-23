var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path');

module.exports = function(args, config, cli) {
    var oldName = null,
        newName = true,
        updateReferences = true;

    function normalize(name) {
        if (name.startsWith('/')) {
            name = name.substring(1);
        }
        return name;
    }
    require('optimist')(args)
        .usage('Usage: $0 rename component <old-component-name> <new-component-name> [options]\n')
        .boolean('no-update-references')
        .describe('no-update-references', 'Do not update references to all components')
        .describe('help', 'Show this message')
        .check(function(argv) {
            if (argv.help) {
                throw '';
            }

            oldName = argv._[0];
            newName = argv._[1];

            if (!oldName || !newName) {
                throw '"old-component-name" and "new-component-name" are required';
            }

            oldName = normalize(oldName);
            newName = normalize(newName);

            if (argv['update-references'] === false) {
                updateReferences = false;
            }
        })
        .argv;

    // Rename tasks:
    // 1) Move the component directory
    // 2) Rename all of the files
    // 3) Rename {shortNameDashSeparated} inside the component directory only
    // 4) Rename {longName} everywhere
    // 5) Rename {longName}/{ShortName} everywhere
    
    var getComponentInfo = require('./command-create-component').getComponentInfo;
    var oldInfo = getComponentInfo(oldName);
    var newInfo = getComponentInfo(newName);

    var componentsDir = config['components.dir'];
    var oldDir = new File(path.join(componentsDir, oldName));
    var newDir = new File(path.join(componentsDir, newName));

    cli.logInfo('rename', 'Renaming component "' + oldName + '" to "' + newName + '"');
    cli.logInfo('info', 'Old directory: ' + oldDir.getAbsolutePath());
    cli.logInfo('info', 'New directory: ' + newDir.getAbsolutePath());

    require('raptor/files/walker').walk(
            oldDir, 
            function(file) {
                if (!file.isFile()) {
                    return;
                }

                var relPath = file.getAbsolutePath().substring(oldDir.getAbsolutePath().length);
                var outFile = new File(newDir, relPath);
                cli.logInfo('copy', file.getAbsolutePath() + ' --> ' + outFile.getAbsolutePath());
            });
}
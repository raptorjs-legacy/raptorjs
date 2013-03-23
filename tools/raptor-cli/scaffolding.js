var dust = require('dustjs-linkedin'),
    File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path');

dust.optimizers.format = function(ctx, node) { return node; };

function Scaffolding(cli) {
    this.cli = cli;
}

Scaffolding.prototype = {
    generate: function(options) {
        var scaffoldDir = options.scaffoldDir,
            outputDir = options.outputDir,
            viewModel = options.viewModel,
            afterFile = options.afterFile,
            cli = this.cli,
            logSuccess = cli.logSuccess,
            logWarn = cli.logWarn,
            logError = cli.logSuccess;
        
        require('raptor/files/walker').walk(
            scaffoldDir, 
            function(file) {
                if (file.isDirectory() || file.getAbsolutePath() === scaffoldDir.getAbsolutePath()) {
                    return;
                }
                
                if (file.getName() === '.DS_Store') {
                    return;
                }

                var inputTemplate = file.readAsString();
                var templateName = file.getName();
                var compiled = dust.compile(inputTemplate, templateName, false);
                
                dust.loadSource(compiled);

                var outputPath = file.getAbsolutePath().slice(scaffoldDir.getAbsolutePath().length + 1);
                if (outputPath.endsWith('.dust')) {
                    outputPath = outputPath.slice(0, 0-'.dust'.length);
                }
                
                var skip = false;
                
                var outputFile = new File(
                    path.join( 
                        outputDir, 
                        outputPath.replace(/_([a-zA-Z0-9]+)_/g, function(match, varName) {
                            var replacement = viewModel[varName];
                            if (replacement === false) {
                                skip = true;
                                return '';
                            }
                            else if (replacement === true) {
                                return '';
                            }
                            return replacement;
                        })));
                
                if (skip) {
                    return false;
                }

                if (!outputFile.exists()) {
                    try
                    {
                        dust.render(
                            templateName, 
                            viewModel, 
                            function(err, out) {
                                outputFile.writeAsString(out);
                                logSuccess('create', outputFile.getAbsolutePath());
                            });
                    }
                    catch(e) {
                        logError('error', 'Unable to write "' + outputFile.getAbsolutePath() + '"');
                    }
                }
                else {
                    logWarn('skip', 'Already exists: ' + outputFile.getAbsolutePath());
                }

                if (afterFile) {
                    afterFile(outputFile);
                }
                
            },
            this);
    }
}

module.exports = Scaffolding;
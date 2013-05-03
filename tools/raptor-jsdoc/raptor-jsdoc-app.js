var raptor = require('raptor');

var define = raptor.createDefine(module);

require('raptor/logging').configure({
    loggers: {
        'ROOT': {level: 'WARN'},
        "raptor/jsdoc": {level: "INFO"},
        "raptor-jsdoc-app": {level: "INFO"},
    }
});

var files = require('raptor/files'),
    File = require('raptor/files/File'),
    jsdoc = require('raptor/jsdoc'),
    walker = require('raptor/files/walker'),
    logger = require('raptor/logging').logger('raptor-jsdoc-app'),
    configArgRegExp=/^(?:-|--)([A-Za-z0-9_\-]+)(?:=([^\s]+))?$/,
    paramArgRegExp=/^([A-Za-z0-9_\-]+)(?:=([^\s]+))?$/,
    cwd = process.cwd(),
    resolveFile = function(path, basePath) {
        if (!path) {
            return path;
        }
        
        return new File(files.resolvePath(basePath || cwd, path));
    },
    parseArgs = function(args) {
        var config={};
        args.forEach(function(arg, i) {
            var matches;
            if ((matches = configArgRegExp.exec(arg))) {
                config[matches[1]] = matches[2] || '';
            }
            else if ((matches = paramArgRegExp.exec(arg))) {
                config[matches[1]] = matches[2];
            }
            else {
                config["source-dir"] = arg;
            }
        });
        
        return config;
    },
    config = parseArgs(process.argv.slice(2));

var outputDir = config['output-dir'] || config['out'] || files.joinPaths(__dirname, 'api');
var src = config['dir'] || config['source-dir'] || config['source'] || config['src'];
var templateFile = config['template'];
var clean = config['clean'] || config['clean-dir'];

if (clean) {
    clean.split(/[;,:]/).forEach(function(cleanPath) {
        var cleanDir = resolveFile(cleanPath);
        logger.info('Deleting directory "' + cleanDir + '"...');
        if (cleanDir.exists()) {
            cleanDir.remove();    
        }
    }, this);
}


outputDir = config['outputDir'] = resolveFile(outputDir);

if (!templateFile) {
    templateFile = resolveFile('default-template', __dirname); 
}
else {
    templateFile = resolveFile(templateFile);
}

if (templateFile.isDirectory()) {
    templateFile = new File(templateFile, 'publish.js');
}

config.templateDir = templateFile.getParentFile();

var propsPaths = config['props'];
if (propsPaths) {
    propsPaths.split(/[;,:]/).forEach(function(path) {
        var propsFile = resolveFile(path);
        if (propsFile.exists()) {
            var props = eval('(' + propsFile.readAsString() + ')');
            raptor.extend(config, props);
        }
    }, this); 
}


exports.run = function() {
    try
    {
        if (!templateFile.exists()) {
            console.error('Template not found at path "' + templateFile + '"');
            return;
        }
        
        if (!src) {
            console.error('"dir" argument is required. Example: raptor-docs dir=path-to-src-dir');
            return;
        }
        
        var sourceDirs = src.split(/[;:,]/).map(function(sourceDir) {
            return resolveFile(sourceDir);
        });
        
        //Add the resources for the plugin to the resource search path
        require('raptor/resources').getSearchPath().addDir(templateFile.getParent());
        require('raptor/resources').getSearchPath().addDir(outputDir);
        
        logger.info("Output directory: " + outputDir);
        logger.info("Source directories: [" + sourceDirs.join(",") + ']');
        logger.info("Template: " + templateFile);
        console.log();

        var currentFile = null;

        var env = jsdoc.createEnvironment();
        env.getSymbols().subscribe({
           'newSymbol': function(eventArgs) {
                eventArgs.type.sourceFile = currentFile;
                console.log('  NEW SYMBOL "' + eventArgs.name + '":\n    ' + eventArgs.type.toString("    "));
           } 
        });
        
        require('raptor/jsdoc/raptor-plugin').load(env);
        
        sourceDirs.forEach(function(sourceDir) {
            logger.info('Loading symbols in directory "' + sourceDir + '"...');
            walker.walk(sourceDir, function(file) {
                currentFile = file;
                env.addFile(file, sourceDir);
                
                if (file.isFile()) {

                    if (file.getExtension() === 'js') {
                        console.log('\n==========================================================================\nLoading symbols in file "' + file + '"...');
                        jsdoc.loadSymbols(file, env);
                    }
                }
            });
            
        });
        
        require(templateFile.getAbsolutePath()).publish(env.getSymbols(), config, env);
    }
    catch(e) {
        logger.error("Unable to generate jsdocs: Exception: " + e, e);
    }
        
};


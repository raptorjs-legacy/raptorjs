require("raptor").createRaptor({
    logging: {
        loggers: {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            "jsdoc": {level: "INFO"},
            "raptor-jsdoc-app": {level: "INFO"},
            'resources': {level: 'WARN'}
        }
    }
});

var files = raptor.require('files'),
    File = files.File,
    jsdoc = raptor.require('jsdoc'),
    walker = raptor.require('files.walker'),
    logger = raptor.require('logging').logger('raptor-jsdoc-app'),
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
    

var outputDir = config['output-dir'] || config['out'] || flies.resolvePath(__dirname, 'api');
var src = config['dir'] || config['source-dir'] || config['source'];
var templateFile = config['template'];

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
        raptor.require('resources').getSearchPath().addDir(templateFile.getParent());
        raptor.require('resources').getSearchPath().addDir(outputDir);
        
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
        
        raptor.require('jsdoc.raptor-plugin').load(env);
        
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


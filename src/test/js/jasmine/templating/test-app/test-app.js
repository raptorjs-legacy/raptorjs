
var files = raptor.require('files'),
    templatePath = files.joinPaths(__dirname, "test.rhtml"),
    templateIncludePath = files.joinPaths(__dirname, "test-include.rhtml"),
    jsonPath = files.joinPaths(__dirname, "test.json"),
    optionsJsonPath = files.joinPaths(__dirname, "test-options.json"),
    outputHtmlPath = files.joinPaths(__dirname, "output.html"),
    logger = raptor.require("logging").logger("test-app"),
    templating = raptor.require("templating"),
    useAnsi = process.env.TERM === 'ansi',
    ansi = function(str) {
        return useAnsi ? str : '';
    },
    readTemplate = function(path) {
        return files.readFileSync(path);
    },
    readData = function() {
        return eval("(" + files.readFileSync(jsonPath) + ")");
    },
    readOptions = function() {
        return eval("(" + files.readFileSync(optionsJsonPath) + ")");
    },
    readAndCompile = function(clear) {
        try {
            if (clear !== false) {
                if (useAnsi) {
                    console.log('\033[7l\033[2J');
                    console.log('\033[0;1m');
                }
                else {
                    console.log('\n\n\n\n\n\n\n\n\n\n\n\n');
                }
            }
            var compiler = raptor.require("templating.compiler").createCompiler(readOptions());
            compiler.compileAndLoad(readTemplate("test-include.rhtml"), "test-include.rhtml");
            
            var templateSrc = readTemplate("test.rhtml");
            var compiledSrc = compiler.compile(templateSrc, "test.rhtml");
            console.log('\n' + compiledSrc + "\n" + ansi("\033[0;37m") + "\n");
            eval(compiledSrc);
            var htmlOutput = templating.renderToString("test", readData());
            console.log(ansi("\033[0;1;33m") + htmlOutput);
            files.writeFileSync(outputHtmlPath, htmlOutput);
        }
        catch(e) {
            console.log(ansi('\033[31m'));
            logger.error(e);
        }
    };
    
readAndCompile();

var fs = require('fs');

fs.watch(templatePath, readAndCompile);
fs.watch(templateIncludePath, readAndCompile);
fs.watch(jsonPath, readAndCompile);
fs.watch(optionsJsonPath, readAndCompile);

//raptor.require("templating.compiler").compileAndLoadResource("/test.rhtml");
//console.log(raptor.require("templating").renderToString("test", {
//    message: "Hello World", 
//    colors: ["red", "green", "blue", "pink"], 
//    rootClass: "test"
//}));
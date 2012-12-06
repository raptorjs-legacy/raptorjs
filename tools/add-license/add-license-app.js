require("raptor").createRaptor({
    logging: {
        loggers: {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            'resources': {level: 'WARN'}
        }
    }
});

var files = require('raptor/files'),
    strings = require('raptor/strings');

var licenseText = files.readAsString(__dirname + "/LICENSE");

var raptorJSModulesDir = files.joinPaths(__dirname, "../../src/main/resources/META-INF/resources/raptor_modules");
var javaSrcDir = files.joinPaths(__dirname, "../../src/main/java");

var walker = require('raptor/files/walker');

var count = 0;

var addLicense = function(srcDir, ext) {
    console.log("Processing source directory " + srcDir + "...");
    
    walker.walk(
            srcDir, 
            function(file) {
                console.log("Processing " + file.getAbsolutePath() + "...");
                var input = file.readAsString();
                if (!strings.startsWith(input, licenseText)) {
                    count++;
                    var output = licenseText + file.readAsString();
                    file.writeAsString(output);
                }
                else {
                    console.log("Skipping " + file.getAbsolutePath() + ". License already added");
                }
                
            }, 
            this,
            {
                fileFilter : function(file) {
                    return file.isFile() && 
                        file.getExtension() == ext;
                },
                dirTraverseFilter : function(dir) {
                    return dir.getName() !== "node_modules";
                }
            });
    console.log();
};

addLicense(raptorJSModulesDir, "js");
addLicense(javaSrcDir, "java");

console.log("DONE. License added to " + count + " files.");

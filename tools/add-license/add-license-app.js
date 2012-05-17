require("raptorjs").createRaptor({
    logging: {
        loggers: {
            'ROOT': {level: 'WARN'},
            'oop-server': {level: 'WARN'},
            'resources': {level: 'WARN'}
        }
    }
});

var files = raptor.require("files"),
    strings = raptor.require('strings');

var licenseText = files.readFully(__dirname + "/LICENSE");

var raptorJSModulesDir = files.joinPaths(__dirname, "../../src/main/resources/META-INF/resources/raptorjs_modules");
var javaSrcDir = files.joinPaths(__dirname, "../../src/main/java");

var walker = raptor.require("files.walker");

var count = 0;

var addLicense = function(srcDir, ext) {
    console.log("Processing source directory " + srcDir + "...");
    
    walker.walk(
            srcDir, 
            function(file) {
                console.log("Processing " + file.getAbsolutePath() + "...");
                var input = file.readFully();
                if (!strings.startsWith(input, licenseText)) {
                    count++;
                    var output = licenseText + file.readFully();
                    file.writeFully(output);
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

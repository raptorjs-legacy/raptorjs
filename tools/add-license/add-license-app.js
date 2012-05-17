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

var srcDir = files.joinPaths(__dirname, "../../src/main/resources/META-INF/resources/raptorjs_modules");
var walker = raptor.require("files.walker");
console.log("Source directory: " + srcDir);

walker.walk(
        srcDir, 
        function(file) {
            console.log("Processing " + file.getAbsolutePath() + "...");
            var input = file.readFully();
            if (!strings.startsWith(input, licenseText)) {
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
                    file.getExtension() == "js";
            },
            dirTraverseFilter : function(dir) {
                return dir.getName() !== "node_modules";
            }
        });
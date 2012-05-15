require('raptorjs').createRaptor({
        resources: {
            searchPath: [
                {
                    type: "dir",
                    path: __dirname + '/raptorjs_modules'
                }
            ]
        },
        logging: {
            loggers: {
                'ROOT': {level: 'WARN'},
                'raptorjs-packager': {level: 'INFO'},
                'oop-server': {level: 'WARN'},
                'resources': {level: 'WARN'}
            }
        }
});

var dir = process.argv[2];
raptor.require("resources").getSearchPath().addDir(dir);

var config = JSON.parse(raptor.require('files').readFully(__dirname + "/raptorjs-config.json"));

var outputDir = __dirname + "/dist-jquery";
if (raptor.require('files').exists(outputDir)) {
    raptor.require('files').remove(outputDir);    
}

var packager = raptor.require('raptorjs-packager');


packager.writeBundles({
    bundlesDir: outputDir + "/bundles",
    pagesDir: outputDir + "/pages",
    bundles: config.bundles,
    pages: config.pages,
    minify: true,
    usePackageBundles: false,
    enabledExtensions: ["browser", "jquery"]
});

console.log('Packaged code successfully written to "' + outputDir + '"');
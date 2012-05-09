
require('raptorjs').createRaptor({
        resources: {
            searchPath: [
                {
                    type: "dir",
                    path: __dirname + '/resources'
                }
            ]
        },
        logging: {
            loggers: {
                'ROOT': {level: 'WARN'},
                'oop-server': {level: 'WARN'},
                'resources': {level: 'WARN'}
            }
        }
});

var logger = raptor.require('logging').logger("demo");
try
{
    var templateResource = raptor.require("resources").findResourceSync("/demo.rhtml");
    var templateSrc = templateResource.readFullySync();
    var compiler = raptor.require("templating.compiler").createCompiler({templateName: "demo"});
    var compiledSrc = compiler.compile(templateSrc, "/demo.rhtml");
    console.log(compiledSrc);
    
    var templating = raptor.require("templating");
    eval(compiledSrc);
    
    templating.helpers.myHelperFunction = function(data) {
        return "Output of my helper function (" + data.name + ")";
    };
    
    var html = templating.renderToString("demo", {name: "TEST", colors: ['red', 'green', 'blue', 'purple']});
    console.log(html);
}
catch(e) {
    //console.error(e);
    logger.error(e);
}
//console.log(raptor.require("templating").renderToString("test", {
//  message: "Hello World", 
//  colors: ["red", "green", "blue", "pink"], 
//  rootClass: "test"
//}));
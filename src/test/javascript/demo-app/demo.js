
require('raptorjs').createRaptor({
        resources: {
            searchPath: [
                {
                    type: "dir",
                    path: __dirname + '/resources'
                }
            ]
        }
});

var templateResource = raptor.require("resources").findResourceSync("/demo.rhtml");
var templateSrc = templateResource.readFullySync();
var compiler = raptor.require("templating.compiler").createCompiler({templateName: "demo"});
var compiledSrc = compiler.compile(templateSrc, "/demo.rhtml");
//console.log(compiledSrc);

var templating = raptor.require("templating");
eval(compiledSrc);

var html = templating.renderToString("demo", {});
console.log(html);

//console.log(raptor.require("templating").renderToString("test", {
//  message: "Hello World", 
//  colors: ["red", "green", "blue", "pink"], 
//  rootClass: "test"
//}));
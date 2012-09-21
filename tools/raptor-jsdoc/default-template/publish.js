var templating = raptor.require('templating'),
    optimizer = raptor.require('optimizer'),
    jsdocUtil = raptor.require('jsdoc-util'),
    File = raptor.require('files').File;


var Publisher = function(symbols, config, env) {
    this.symbols = symbols;
    this.config = config;
    this.env = env;
    
    this.outputDir = config.outputDir;
    this.templatedir = config.templateDir;
    
    this.optimizerEngine = optimizer.createOptimizer(new File(this.templatedir, "raptor-optimizer.xml"), config);
};

Publisher.prototype = {
    createTemplateContext: function() {
        var context = templating.createContext();
        
        var attrs = context.getAttributes().jsdocs = {};
        attrs.symbols = this.symbols;
        attrs.config = this.config;
        attrs.env = this.env;
        attrs.outputDir = this.config.outputDir;
        attrs.optimizer = this.optimizerEngine;
        attrs.baseUrl = this.config.baseUrl || "/api";
        return context;
    },
    
    publish: function() {
        this.symbols.forEachSymbol(function(name, type) {
            this.writeSymbolPage(name, type);
        }, this);
    },
    
    writeSymbolPage: function(symbolName, type) {
        var context = this.createTemplateContext();
        var outputFile = jsdocUtil.symbolFile(symbolName, context);
        console.log('Writing symbol page "' + symbolName + '" to ' + outputFile + "...");
        
        var attrs = context.getAttributes().jsdocs;
        attrs.basePath = outputFile.getParent();
        
        var html = templating.renderToString("pages/symbol", {
                symbolName: symbolName,
                type: type,
                optimizer: this.optimizerEngine,
                basePath: attrs.basePath,
                symbols: this.symbols //All symbols are needed for the left nav
            },
            context);
        
        
        outputFile.writeFully(html);
    }
};



exports.publish = function(symbols, config, env) {
    var publisher = new Publisher(symbols, config, env);
    publisher.publish();
};
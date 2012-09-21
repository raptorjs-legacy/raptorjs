raptor.define(
    'jsdoc-util',
    function() {
        var File = raptor.require('files').File,
            safeFilename = function(name) {
                return name.replace(/[^A-Za-z0-9_\-\.]/g, '_');
            };
        
        return {
            symbolDir: function(symbolName, context) {
                if (!context) {
                    throw raptor.createError(new Error('"context" argument not set for context'));
                }
                
                var attrs = context.getAttributes().jsdocs;
                return new File(attrs.outputDir, safeFilename(symbolName));
            },
            
            symbolFile: function(symbolName, context) {
                if (!context) {
                    throw raptor.createError(new Error('"context" argument not set for context'));
                }
                
                return new File(this.symbolDir(symbolName, context), "index.html");
            },
            
            
            symbolPath: function(symbolName, context) {
                return this.symbolFile(symbolName, context).getAbsolutePath();
            },
            
            symbolUrl: function(targetSymbolName, context) {
                if (!context) {
                    throw raptor.createError(new Error('"context" argument not set for context'));
                }
                
                var attrs = context.getAttributes().jsdocs;
                if (!attrs) {
                    throw raptor.createError(new Error('"jsdocs" attribute not set for context'));
                }
                var symbols = attrs.symbols;

                if (!symbols.hasSymbol(targetSymbolName)) {
                    return;
                }
                
                var profile = attrs.optimizer.getConfig().getParam("profile") || "production";
                
                if (profile === "production") {
                    return attrs.baseUrl + "/" + targetSymbolName + "/";
                }
                else {
                    return require('path').relative(attrs.basePath, this.symbolPath(targetSymbolName, context));
                }
                
                
            }
        };
    });
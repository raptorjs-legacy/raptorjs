var templating = raptor.require('templating'),
    optimizer = raptor.require('optimizer'),
    jsdocUtil = raptor.require('jsdoc-util'),
    logger = raptor.require('logging').logger('publish')
    File = raptor.require('files').File;


var Publisher = function(symbols, config, env) {
    this.symbols = symbols;
    this.config = config;
    this.env = env;
    this.outputDir = config.outputDir;
    this.templatedir = config.templateDir;
    this.optimizer = this.optimizerEngine = optimizer.createOptimizer(new File(this.templatedir, "raptor-optimizer.xml"), config);
    this.profile = this.optimizer.getConfig().getParam("profile") || "production";
    this.baseUrl = this.config.baseUrl || "/api";
    jsdocUtil.context = this;
    
};

Publisher.prototype = {
    createTemplateContext: function() {
        var context = templating.createContext();
        context.getAttributes().jsdocs = this;
        return context;
    },
    

    /**
     * Attaches all of the instance properties found in prototype methods to the main
     * constructor class.
     * 
     * @param {jsdoc.Type} type The type associated with the constructor function for a class
     * @return {void} 
     * @private
     */
    _collectInstanceTypes: function(type) {
        if (type.isJavaScriptFunction()) {
            var protoType = type.getPropertyType("prototype");
            if (protoType) {
                protoType.forEachProperty(function(protoProp) {
                    var protoPropType = protoProp.type;
                    if (protoPropType && protoPropType.isJavaScriptFunction()) {
                        protoPropType.forEachInstanceProperty(function(instanceProp) {
                            type.setInstanceProperty(instanceProp);
                        }, this);
                    }
                });
            }
        }
    },

    _handleBorrows: function(type) {
        /*
         * Handle tags such as:  @borrows oop.inherit as inherit
         */
        var borrowTags = type.getCommentTags("borrow");
        borrowTags.forEach(function(borrowTag) {
            var borrowFrom = borrowTag.borrowFrom;
            var borrowFromPropName = borrowTag.borrowFromPropName;
            var borrowAs = borrowTag.borrowAs;

            var borrowFromType = this.symbols.resolveSymbolType(borrowFrom);
            if (!borrowFromType) {
                console.error('WARNING: Unable to find symbol with name "' + borrowFrom + '" for borrow tag "' + borrowTag + '".');
            }
            else {
                var borrowProp = borrowFromType.getProperty(borrowFromPropName);
                if (!borrowProp) {
                    console.error('WARNING: Unable to find property with name "' + borrowFromPropName + '" for borrow tag "' + borrowTag + '".');
                }
                else {
                    if (borrowAs) {
                        borrowProp = raptor.extend({}, borrowProp);
                        borrowProp.name = borrowAs;
                    }

                    borrowProp.borrowFrom = borrowFrom;
                    borrowProp.borrowFromPropName = borrowFromPropName;
                    borrowProp.borrowAs = borrowAs;

                    type.setProperty(borrowProp);
                }
            }

        }, this);
    },

    _handleExtension: function(type) {
        

        if (!type.getExtensionFor()) {
            return;
        }



        var extendsTarget = this.symbols.getSymbolType(type.getExtensionFor());
        if (!extendsTarget) {
            console.log('WARNING: Extension target not found with name "' + type.getExtensionFor() + '" for ' + type.getLabel());
            return;
        }

        var targetType = null;
        if (extendsTarget.isJavaScriptFunction()) {
            targetType = extendsTarget.getPropertyType("prototype");
            if (!targetType) {
                targetType = new Type("object");
                extendsTarget.setProperty({
                    name: "prototype",
                    type: targetType
                });
            }
        }
        else {
            targetType = extendsTarget;
        }

        type.forEachProperty(function(mixinSourceProp) {
            var mixinTargetProp = raptor.extend({}, mixinSourceProp);
            mixinTargetProp.mixinSource = type;
            mixinTargetProp.label = mixinSourceProp.name;
            mixinTargetProp.name = mixinSourceProp.name + "_" + type.getExtension();
            targetType.setProperty(mixinTargetProp);
        }, this);

    },

    publish: function() {
        
        this.symbols.forEachSymbol(function(name, type) {
            this._collectInstanceTypes(type);
            this._handleBorrows(type);
            if (type.getExtensionFor()) {
                this._handleExtension(type);    
            }
        }, this);

        // this.symbols.filter(function(name, type) {
        //     if (type.extensionFor) {
        //         return false;
        //     }

        //     return true;
        // });

        this.symbols.forEachSymbol(this.writeSymbolPage, this);
        this.env.forEachSourceFile(this.writeSourcePage, this);
        
    },
    
    writeSymbolPage: function(symbolName, type) {
        var context = this.createTemplateContext();
        var outputFile = jsdocUtil.symbolFile(symbolName, context);
        console.log('Writing symbol page "' + symbolName + '" to ' + outputFile + "...");
     
        this.currentOutputDir = outputFile.getParent();
        this.currentSymbolName = symbolName;

        var html = templating.renderToString("pages/symbol", {
                symbolName: symbolName,
                type: type,
                optimizer: this.optimizerEngine,
                outputDir: this.outputDir,
                baseHref: this.profile === 'development' ? require('path').relative(this.currentOutputDir, this.outputDir.getAbsolutePath()) : null
            },
            context);

        outputFile.writeFully(html);
        
        this.currentOutputDir = null;
        this.currentSymbolName = null;
    },


    writeSourcePage: function(source) {
        if (source.file.isDirectory()) {
            return;
        }
        
        var outputFile = jsdocUtil.sourceOutputFile(source.file);
        this.currentOutputDir = outputFile.getParent();
        this.currentOutputFile = outputFile;

        console.log('Writing source file for "' + source.relativePath + '" to ' + outputFile + "...");
        
        var context = this.createTemplateContext();

        var ext = source.file.getExtension();
        var modes = {
            'js': "sh_javascript_dom"
        };

        var html = templating.renderToString("pages/source", {
                path: source.relativePath,
                optimizer: this.optimizerEngine,
                outputDir: this.outputDir,
                mode: modes[ext],
                src: source.file.readFully(),
                baseHref: this.profile === 'development' ? require('path').relative(this.currentOutputDir, this.outputDir.getAbsolutePath()) : null
            },
            context);

        outputFile.writeFully(html);
        
        this.currentOutputDir = null;
        this.currentOutputFile = null;
    }
};



exports.publish = function(symbols, config, env) {
    var publisher = new Publisher(symbols, config, env);
    publisher.publish();
};
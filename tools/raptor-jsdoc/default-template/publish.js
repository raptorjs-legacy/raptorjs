var raptor = require('raptor'),
    templating = require('raptor/templating'),
    optimizer = require('raptor/optimizer'),
    jsdocUtil = require('jsdoc-util'),
    logger = require('raptor/logging').logger('publish'),
    File = require('raptor/files/File'),
    promises = require('raptor/promises');


var Publisher = function(symbols, config, env) {
    this.symbols = symbols;
    this.config = config;
    this.env = env;
    this.outputDir = config.outputDir;
    this.templatedir = config.templateDir;
    this.profile = config['profile'] || "production";
    this.baseUrl = this.config.baseUrl || "/api";
    jsdocUtil.context = this;
    this.autoCompleteSymbols = [];
    this.promises = [];
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
        var sourceType = type;
        if (extendsTarget.isJavaScriptFunction()) {
            sourceType = type.getPropertyType("prototype");
            if (!sourceType) {
                return;
            }
            
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

        sourceType.forEachProperty(function(mixinSourceProp) {
            var mixinTargetProp = raptor.extend({}, mixinSourceProp);
            mixinTargetProp.mixinSource = type;
            mixinTargetProp.label = mixinSourceProp.name;
            mixinTargetProp.name = mixinSourceProp.name + "_" + type.getExtension();
            targetType.setProperty(mixinTargetProp);
        }, this);

    },

    _addAutoCompleteSymbols: function(type) {
        var baseLabel = type.getLabelNoExt();
        
        var autoCompleteSymbols = this.autoCompleteSymbols;
        var typeName = function(type, isProp) {
            
            var typeName = null;

            if (isProp) {
                if (type) {
                    if (type.extension) {
                        return "extension";
                    }
                    else {
                        return type.isJavaScriptFunction() ? "function" : "property";
                    }
                }
                else {
                    return "property";
                }
            }
            else {
                if (!type) {
                    return null;
                }
                else if (type.name === 'global') {
                    return "global"
                }
                else if (type.raptorType || type.hasCommentTag("raptor")) {
                    return "raptor-" + (type.raptorType || "module");
                    
                }
                else if (type.hasCommentTag("class") || type.hasProperty("prototype")) {
                    return "class";
                }
                else {
                    return "object";
                }
            }
            
        };

        var typeUrl = jsdocUtil.symbolUrl(type.getName());
        if (typeUrl) {
            autoCompleteSymbols.push({
                type: typeName(type),
                url: jsdocUtil.symbolUrl(type.getName()),
                text: baseLabel + (type.extension ? " (" + type.extension + " Extension)" : "")
            });
        }
        

        var addProps = function(parentType, suffix) {
            parentType.forEachProperty(function(prop) {
                if (prop.name === 'prototype') {
                    return;
                }

                var propUrl = typeName(prop.type, true);
                if (propUrl) {
                    autoCompleteSymbols.push({
                        type: typeName(prop.type, true),
                        url: jsdocUtil.symbolUrl(type.getName() + suffix + "#" + prop.name),
                        text: baseLabel + suffix + "." + prop.name + (type.getExtension() ? " (" + type.getExtension() + " Extension)" : "")
                    });
                }
                
            }, this);
        };

        addProps(type, "");

        var protoType = type.getPropertyType("prototype");
        if (protoType) {
            addProps(protoType, ".prototype");            
        }

        var instanceType = type.getInstanceType();
        if (instanceType) {
            addProps(instanceType, ".this");            
        }

        this.autoCompleteSymbols.sort(function(a, b) {
            a = a.text;
            b = b.text;
            return a < b ? -1 : (a > b ? 1 : 0);
        })
    },

    publish: function() {
        optimizer.configure(new File(this.templatedir, "raptor-optimizer.xml"), this.config);
        
        this.symbols.forEachSymbol(function(name, type) {
            this._collectInstanceTypes(type);
            this._handleBorrows(type);
            this._addAutoCompleteSymbols(type);

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

        
        
        this.writeAutocompleteSymbols();
        this.writeIndexPage();
        this.symbols.forEachSymbol(this.writeSymbolPage, this);
        this.env.forEachSourceFile(this.writeSourcePage, this);

        promises.all(this.promises)
            .then(
                function() {
                    console.info('DONE. API documentation successfully written to "' + this.outputDir + '"');
                },
                function(e) {
                    logger.error("Unable to publish API docs. Exception: " + e, e);
                });
    },

    calculateChecksum: function(code) {
        var shasum = require('crypto').createHash('sha1');
        shasum.update(code);
        var checksum = shasum.digest('hex'),
            checksumLength = 8;
        
        if (checksumLength > 0 && checksum.length > checksumLength) {
            checksum = checksum.substring(0, checksumLength);
        }
        
        return checksum;
    },

    writeAutocompleteSymbols: function() {
        var json = JSON.stringify(this.autoCompleteSymbols);
        this.autocompleteSymbolsFilename = "autocomplete-symbols.js";
        var outputFile = new File(this.outputDir, this.autocompleteSymbolsFilename );
        console.log('Writing autocomplete symbols to "' + outputFile + '"...');
        outputFile.writeAsString("var autocompleteSymbols=" + json);

    },
    
    writeIndexPage: function() {
        var context = this.createTemplateContext();
        var outputFile = new File(this.outputDir, "index.html");
        console.log('Writing index page to ' + outputFile + "...");
     
        this.currentOutputDir = outputFile.getParent();

        var promise = templating.renderToFile(
            "pages/index", 
            {
                optimizer: this.optimizerEngine,
                outputDir: this.outputDir,
                baseHref: require('path').relative(this.currentOutputDir, this.outputDir.getAbsolutePath())
            },
            outputFile,
            context);

        this.promises.push(promise);
        
        this.currentOutputDir = null;
    },
    
    writeSymbolPage: function(symbolName, type) {
        var context = this.createTemplateContext();
        var outputFile = jsdocUtil.symbolFile(symbolName, context);
        console.log('Writing symbol page "' + symbolName + '" to ' + outputFile + "...");
     
        this.currentOutputDir = outputFile.getParent();
        this.currentSymbolName = symbolName;

        var promise = templating.renderToFile(
            "pages/symbol", 
            {
                symbolName: symbolName,
                type: type,
                outputDir: this.outputDir,
                baseHref: require('path').relative(this.currentOutputDir, this.outputDir.getAbsolutePath())
            },
            outputFile,
            context);

        this.promises.push(promise);
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
        this.currentSourcePath = source.relativePath;

        console.log('Writing source file for "' + source.relativePath + '" to ' + outputFile + "...");
        
        var context = this.createTemplateContext();

        var ext = source.file.getExtension();
        var modes = {
            'js': "sh_javascript_dom",
            'json': "sh_javascript_dom"
        };

        var promise = templating.renderToFile(
            "pages/source", 
            {
                path: source.relativePath,
                outputDir: this.outputDir,
                mode: modes[ext],
                src: source.file.readAsString(),
                baseHref: require('path').relative(this.currentOutputDir, this.outputDir.getAbsolutePath())
            },
            outputFile,
            context);

        this.promises.push(promise);
        
        this.currentOutputDir = null;
        this.currentOutputFile = null;
        this.currentSourcePath = null;
    }
};



exports.publish = function(symbols, config, env) {
    var publisher = new Publisher(symbols, config, env);
    publisher.publish();
};
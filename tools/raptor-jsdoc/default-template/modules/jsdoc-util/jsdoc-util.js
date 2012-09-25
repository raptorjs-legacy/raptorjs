raptor.define(
    'jsdoc-util',
    function() {
        var File = raptor.require('files').File,
            strings = raptor.require('strings'),
            safeFilename = function(name) {
                return name.replace(/[^A-Za-z0-9_\-\.]/g, '_');
            };
        
        return {
            context: null,
            
            symbolDir: function(symbolName) {
                var context = this.context;
                if (!this.context) {
                    throw raptor.createError(new Error('"context" argument not set for context'));
                }
                
                return new File(context.outputDir, safeFilename(symbolName));
            },
            
            symbolFile: function(symbolName) {
                var context = this.context;
                if (!context) {
                    throw raptor.createError(new Error('"context" argument not set for context'));
                }
                
                return new File(this.symbolDir(symbolName), "index.html");
            },

            sourceOutputFile: function(file) {
                return this.sourceLink(file).outputFile;
            },
            
            sourceLink: function(file) {
                var context = this.context;
                
                if (!context) {
                    throw raptor.createError(new Error('"context" argument not set for context'));
                }

                var env = context.env;
                var sourceDir = env.getSourceDirForFile(file);
                if (!sourceDir) {
                    throw raptor.createError(new Error("Source file not registered: "+ file));
                }
                var relativePath = file.getAbsolutePath().substring(sourceDir.getAbsolutePath().length);
                var label = relativePath;
                relativePath += '.html'
                var sourceOutputDir = new File(context.outputDir, "source");
                var href;
                var profile = context.profile;
                
                if (profile === "production") {
                    href = context.baseUrl + '/source' + relativePath;
                }
                else {
                    href = '.' + '/source' + relativePath;
                }
                
                return {
                    href: href,
                    outputFile: new File(sourceOutputDir, relativePath),
                    label: label
                };
            },
            
            symbolPath: function(symbolName) {
                return this.symbolFile(symbolName).getAbsolutePath();
            },
            
            symbolLink: function(targetSymbolName) {
                var context = this.context;
                
                if (!context) {
                    throw raptor.createError(new Error('"context" argument not set for context'));
                }

                var symbols = context.symbols;

                ////////

                var lastHash = targetSymbolName.lastIndexOf("#");
                var propName = null;
                if (lastHash !== -1) {
                    propName = targetSymbolName.substring(lastHash+1).trim();
                    targetSymbolName = targetSymbolName.substring(0, lastHash).trim();

                    if (targetSymbolName === '') {
                        targetSymbolName = context.currentSymbolName;
                    }
                }

                var suffixPropName = null;


                var handleSuffix = function(suffix) {
                    if (suffixPropName) {
                        return;
                    }
                    var suffixToCheck = "." + suffix;

                    if (strings.endsWith(targetSymbolName, suffixToCheck)) {
                        suffixPropName = suffix;
                        targetSymbolName = targetSymbolName.substring(0, targetSymbolName.length-suffixToCheck.length);
                    }
                };

                handleSuffix("prototype");
                handleSuffix("this");

                
                
                

                var type = symbols.getSymbolType(targetSymbolName),
                    href = null,
                    propParentType = type;
                
                var findProp = function(propName, suffix) {
                    if (suffixPropName) {
                        return;
                    }

                    var subProp = type.getPropertyType(suffix);
                    if (subProp) {
                        if (subProp.hasProperty(propName)) {
                            suffixPropName = suffix;
                        }
                    }
                }

                if (type) {
                    label = type.getLabel();

                    if (propName) {
                        if (suffixPropName) {
                            propParentType = propParentType.getPropertyType(suffixPropName);
                        }

                        if (propParentType) {
                            if (!propParentType.hasProperty(propName)) {
                                findProp(propName, "this");
                                findProp(propName, "prototype");
                            }
                        }
                    }

                    

                    if (propName) {
                        label += "." + (suffixPropName ? suffixPropName + "." + propName : propName);    
                    }
                    

                    var profile = context.profile;
                    
                    

                    if (profile === "production") {
                        href = context.baseUrl + "/" + targetSymbolName + "/";
                    }
                    else {
                        href = './' + targetSymbolName + "/index.html";
                    }

                    if (propName) {
                        href += "#" + (suffixPropName ? suffixPropName + "." + propName : propName);
                    }
                    
                    return {
                        href: href,
                        label: label
                    };
                }
                else {
                    return {
                        label: targetSymbolName
                    };
                }                
            },

            symbolUrl: function(targetSymbolName) {

                var link = this.symbolLink(targetSymbolName);
                return link.href;
                
            }
        };
    });
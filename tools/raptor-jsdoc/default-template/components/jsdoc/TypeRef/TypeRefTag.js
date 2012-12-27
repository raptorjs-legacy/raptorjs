define(
    "components.jsdoc.TypeRef.TypeRefTag",
    ['raptor'],
    function(raptor, require) {
        
        var jsdocUtil = require('jsdoc-util'),
            templating = require('raptor/templating'),
            strings = require('raptor/strings'),
            Type = require('raptor/jsdoc/Type');
        
        var ParsedType = function(symbolName, context) {
            var attrs = context.getAttributes().jsdocs;
            if (!attrs) {
                throw raptor.createError(new Error('"jsdocs" attribute not set for context'));
            }
            var symbols = attrs.symbols;

            this.label = null;
            this.href = null;
            
            this.genericTypes = null;
            this.allowedTypes = [];

            var parts = symbolName.split(/\s*\|\s*/);
            if (parts.length > 1) {
                parts.forEach(function(part) {
                    this.allowedTypes.push(new ParsedType(part, context));
                }, this);
            }
            else {
                var propNames = [];

                var genericStart = symbolName.indexOf('<');
                if (genericStart != -1) {
                    var genericEnd = symbolName.lastIndexOf('>');
                    if (genericEnd != -1) {
                        var genericText = symbolName.substring(genericStart+1, genericEnd);
                        this.genericTypes = [];
                        var genericParts = genericText.split(/\s*,\s*/);
                        genericParts.forEach(function(genericPart) {
                            this.genericTypes.push(new ParsedType(genericPart, context));
                        }, this);

                        symbolName = symbolName.substring(0, genericStart);
                        this.href = jsdocUtil.symbolUrl(symbolName);
                    }
                }
                else {
                    

                    this.href = jsdocUtil.symbolUrl(symbolName);

                    if (strings.endsWith(symbolName, ".prototype")) {
                        symbolName = symbolName.substring(0, symbolName.length - ".prototype");
                        propNames.push("prototype");
                        
                    }
                    else if (strings.endsWith(symbolName, ".this")) {
                        symbolName = symbolName.substring(0, symbolName.length - ".this");
                        propNames.push("this");
                    }


                    var propSeparator = symbolName.lastIndexOf('#');
                    if (propSeparator !== -1) {
                        propNames.push(symbolName.substring(propSeparator+1));
                        symbolName = symbolName.substring(0, propSeparator);
                    }
                }

                

                var targetSymbolType = symbols.getSymbolType(symbolName);
                if (targetSymbolType) {
                    symbolName = targetSymbolType.getLabel();
                }

                this.label = symbolName + (propNames.length ? '.' + propNames.join('.') : '');
            }
            

        };

        ParsedType.prototype = {
            isMultiType: function() {
                return this.allowedTypes.length !== 0;
            },

            isGeneric: function() {
                return this.genericTypes != null;
            }
        };

        var TypeRefTag = function(config) {
            
        };
        
        TypeRefTag.prototype = {
            process: function(input, context) {
                var symbolName = input['type'];
                if (!symbolName) {
                    context.write("(empty type)");
                    return;
                }
                if (symbolName instanceof Type) {
                    symbolName = symbolName.getName();
                }
                
                var parsedType = new ParsedType(symbolName, context);
                if (input.label) {
                    parsedType.label = input.label;
                }
                
                templating.render("components/jsdoc/TypeRef", {
                    type: parsedType,
                }, context);
            }
        };
        
        return TypeRefTag;
    });
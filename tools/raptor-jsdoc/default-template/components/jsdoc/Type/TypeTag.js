define(
    "components.jsdoc.Type.TypeTag",
    ['raptor'],
    function(raptor, require) {
        
        var jsdocUtil = require('jsdoc-util'),
            templating = require('raptor/templating'),
            summarize = function(desc) {
                if (!desc) return desc;
                
                var summary = desc;
                var remaining = null;

                var matches = desc.match(/^\s*((?:\n|.)*?)(\.[ ]*?[\n]|[ ]*?[\n][\n]|$)/i); //Summary is ended by a perioed+newline or a newline followed by one or more spaces
                if (matches) {
                    if (matches[2] && matches[2].charAt(0) == '.') {
                        summary = matches[1] + '.'; //Keep the period in the summary
                    }
                    else {
                        summary = matches[1];
                    }
                    
                    remaining = desc.substring(matches.index + matches[0].length).trim();
                }
                
                
                if (!remaining){
                    remaining = null;
                }

                return {
                    shortDesc: summary,
                    remainingDesc: remaining
                };
            };

        var ParamViewModel = function(param, paramTag) {
            this.name = param.name;
            if (paramTag) {
                this.type = paramTag.paramType;
                this.desc = paramTag.paramDesc;    
            }
        };

        ParamViewModel.prototype = {
            getTypeName: function() {
                return this.type;
            }
        };

        var PropertyViewModel = function(prop, context, anchorPrefix, sourceType) {
            var attrs = context.getAttributes().jsdocs;
            if (!attrs) {
                throw raptor.createError(new Error('"jsdocs" attribute not set for context'));
            }

            this._prop = prop;
            this._sourceType = sourceType;
            this.name = prop.name;
            this.params = [];
            this.modifiers = [];
            this.context = context;
            this.sections = [];

            this.anchorName = (anchorPrefix ? anchorPrefix + prop.name : prop.name);
            this.moreElId = null;

            this.permaLinkHref = jsdocUtil.symbolUrl(attrs.currentSymbolName) + "#" + this.anchorName;
            
            this._isMixin = prop.mixinSource != null;

            

            var comment = prop.comment;
            if (!comment && prop.type && prop.type.hasComment()) {
                comment = prop.type.getComment();
            }

            if (comment) {
                var summary = summarize(comment.getDescription());
                this.shortDesc = summary.shortDesc;
                this.remainingDesc = summary.remainingDesc;
                
                var deprecatedTag = comment.getTag("deprecated");
                if (deprecatedTag) {
                    this.deprecated = true;
                    this.sections.push({
                        type: "deprecated",
                        label: "Deprecated",
                        message: deprecatedTag.getValue()
                    });
                    this.modifiers.push({
                        type: "deprecated"
                    });
                }
                
                
            }

            if (this.isFunction()) {
                var params = this.params = [];
                
                this._prop.type.forEachFunctionParam(function(param) {
                    params.push(param);
                }, this, this._prop.comment);

                if (params.length) {
                    this.sections.push({
                        type: "params",
                        label: "Parameters",
                        params: params
                    });    
                }
                
                
            }
            
            if (comment) {
                var returnTag = comment.getTag("return");

                if (returnTag) {
                    this.returnType = returnTag.returnType;
                    this.returnDesc = returnTag.returnDesc;
                    
                    this.sections.push({
                        type: "returns",
                        label: "Returns",
                        returnType: returnTag.returnType,
                        returnDesc: returnTag.returnDesc
                    });    
                }
            }

            if (comment) {
                var seeTags = comment.getTags('see');
                if (seeTags.length) {
                    this.sections.push({
                        type: "see",
                        label: "See",
                        see: seeTags
                    });     
                }
            }

            

            if (prop.borrowFrom) {
                this.modifiers.push({
                    type: "borrow",
                    borrowFrom: prop.borrowFrom,
                    borrowFromPropName: prop.borrowFromPropName
                });
            }
            
            if (prop.mixinSource) {
                this.modifiers.push({
                    type: "mixin",
                    mixinSource: prop.mixinSource
                });
            }

            if (this.hasMore()) {
                this.moreElId = this.anchorName + "-more";
            }

        };

        PropertyViewModel.prototype = {

            isMixin: function() {
                return this._isMixin;
            },

            getLabel: function() {
                return this._prop.label || this._prop.name;
            },

            isConstructor: function() {
                return this._prop.ctor === true;
            },

            isFunction: function() {
                return (this._prop.type && this._prop.type.isJavaScriptFunction());// || (this._prop.comment && this._prop.comment;
            },

            hasMore: function() {
                return this.remainingDesc || this.sections.length > 0;
            },

            hasModifiers: function() {

            },

            hasModifiers: function() {
                return this.modifiers.length > 0;
            },
            
            getTypeName: function() {
                return this._prop.type ? this._prop.type.getName() : null;
            }
        };

        var PropertiesViewModel = function(typeViewModel, context, anchorPrefix) {
            this._typeViewModel = typeViewModel;
            this.propertiesByName = {};
            this.context = context;
            this.anchorPrefix = anchorPrefix;
        };

        PropertiesViewModel.prototype = {
            addProperty: function(prop, sourceType) {

                var name = prop.name;
                var propertyViewModel = new PropertyViewModel(prop, this.context, this.anchorPrefix, sourceType);

                if (sourceType) {
                    if (sourceType === this._typeViewModel._type) {
                        var existingProperty = this.propertiesByName[name];
                        
                        
                        if (existingProperty) {
                            
                            
                            propertyViewModel.modifiers.push({
                                type: "overrides",
                                overridesMethodRef: existingProperty._sourceType.getName() + "#" + this.anchorPrefix + name,
                                overridesSource: existingProperty._sourceType ? existingProperty._sourceType.getLabel() : null
                            });
                        }
                    }
                    else {
                        /*
                         * Handle inheritance
                         */
                        propertyViewModel.modifiers.push({
                            type: "inherits",
                            inherits: sourceType.getName() || sourceType.getLabel()
                        });
                    }
                }

                this.propertiesByName[name] = propertyViewModel;

            },

            isEmpty: function() {
                return Object.keys(this.propertiesByName).length === 0;
            },

            toString: function() {
                return "[PropertiesViewModel [" + this.properties.join(", ") + "]]";
            },

            getProperties: function() {
                var properties = require('raptor/objects').values(this.propertiesByName);
                properties.sort(function(a, b) {
                    a = a.name.toLowerCase();
                    b = b.name.toLowerCase();
                    return a < b ? -1 : (a > b ? 1 : 0);
                });
                return properties;
            }
        };

        var TypeViewModel = function(type, symbols, context) {
            this._type = type;
            this._protoType = type.getPropertyType("prototype");
            this.symbols = symbols;
            this.name = type.name;
            this.label = type.getLabel();
            this._isClass = type.isJavaScriptFunction() && type.raptorType !== 'module';

            this.sourceLink = null;

            if (type.sourceFile) {
                this.sourceLink = jsdocUtil.sourceLink(type.sourceFile);
            }

            var comment = null;
            if (type.raptorType) {
                comment = type.raptorDefineComment;
            }
            else {
                comment = type.getComment();    
            }
            if (comment) {
                this.desc = comment.getDescription();
            }
            
            this.permaLinkHref = jsdocUtil.symbolUrl(this.name);

            this.staticMethods = new PropertiesViewModel(this, context);
            this.staticProperties = new PropertiesViewModel(this, context);
            
            this.instanceMethods = new PropertiesViewModel(this, context, "this.");
            this.instanceProperties = new PropertiesViewModel(this, context, "this.");
            
            this.protoMethods = new PropertiesViewModel(this, context, "prototype.");
            this.protoProperties = new PropertiesViewModel(this, context, "prototype.");

            this.ctorProperties = new PropertiesViewModel(this, context);

            if (this.isClass()) {
                this.ctorProperties.addProperty({
                    ctor: true,
                    name: type.getShortName(),
                    type: type,
                    comment: type.getComment()
                });
            }
            

            this.addStaticProps();
            this.addProtoProps(type);
        };

        TypeViewModel.prototype = {

            addStaticProps: function() {

                this._type.forEachProperty(function(prop) {
                    if (prop.type && prop.type.isJavaScriptFunction()) {
                        this.staticMethods.addProperty(prop, this._type);
                    }
                    else if (prop.name !== 'prototype') {
                        this.staticProperties.addProperty(prop, this._type);
                    }
                }, this);
            },

            addProtoProps: function(ctorType) {
                var superclassName = ctorType.getSuperclassName();
                if (superclassName) {
                    var superclassType = this.symbols.getSymbolType(superclassName);
                    if (!superclassType) {
                        console.error('WARNING: Superclass not found with name "' + superclassName + '"');
                    }
                    else {
                        this.addProtoProps(superclassType);    
                    }
                }



                var protoType = ctorType.getPropertyType("prototype");
                if (protoType) {
                    protoType.forEachProperty(function(prop) {
                        if (prop.type && prop.type.isJavaScriptFunction()) {
                            this.protoMethods.addProperty(prop, ctorType);
                        }
                        else {
                            this.protoProperties.addProperty(prop, ctorType);
                        }
                    }, this);
                }
                

            },

            isClass: function(prop) {
                return this._isClass;
            },

            toString: function() {
                return "[TypeViewModel " + this.name + "]";
            }
        };

        var TypeTag = function(config) {
            
        };
        
        
        TypeTag.prototype = {
            process: function(input, context) {
                var widgetConfig = {},
                    symbols = context.getAttributes().jsdocs.symbols;

                var type = new TypeViewModel(input.type, symbols, context);
                

                templating.render("components/jsdoc/Type", {
                    widgetConfig: widgetConfig,
                    type: type
                }, context);
            }
        };
        
        return TypeTag;
    });
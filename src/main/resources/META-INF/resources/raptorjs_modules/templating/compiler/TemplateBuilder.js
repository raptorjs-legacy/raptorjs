raptor.defineClass(
    'templating.compiler.TemplateBuilder',
    function(raptor) {
        var stringify = raptor.require('json.stringify').stringify,
            strings = raptor.require('strings'),
            errors = raptor.errors,
            Expression = raptor.require('templating.compiler.Expression'),
            forEach = raptor.forEach;
        
        var TemplateBuilder = function(compiler) {
            this.compiler = compiler;
            this.options = compiler.options;
            this.taglibs = {};
            this.templateName = null;
            this.curText = null;
            this.attributes = {};
            
            this.staticJavaScriptVars = [];
            this.helperFunctionsAdded = {};
            
            this.renderJavaScriptVars = [];
            
            this.javaScriptCode = strings.createStringBuilder(); 
            
            this.getStaticHelperFunction("empty", "e");
            this.getStaticHelperFunction("notEmpty", "ne");
            this.getContextHelperFunction("write", "w");
            
            this.preserveWhitespace = 0;
        };
        
        TemplateBuilder.prototype = {
                
            getTemplateName: function() {
                return (this.options ? this.options.templateName : null) || this.templateName;
            },
            
            beginPreserveWhitespace: function() {
                this.preserveWhitespace++;
            },
            
            endPreserveWhitespace: function() {
                this.preserveWhitespace--;
            },
            
            isPreserveWhitespace: function() {
                return this.preserveWhitespace > 0;
            },

            _getHelperFunction: function(varName, propName, isStatic) {
                var key = propName + ":" + (isStatic ? "static" : "context");
                var added = this.helperFunctionsAdded[key];
                if (added) {
                    return added;
                }
                else {
                    if (isStatic) {
                        this.addStaticJavaScriptVar(varName, "helpers." + propName);
                    }
                    else {
                        this.addRenderJavaScriptVar(varName, "contextHelpers." + propName);
                    }
                    
                    this.helperFunctionsAdded[key] = varName;
                    return varName;
                }
            },
            
            getContextHelperFunction: function(varName, propName) {
                return this._getHelperFunction(varName, propName, false);
            },
            
            getStaticHelperFunction: function(varName, propName) {
                return this._getHelperFunction(varName, propName, true);
            },
            
            addStaticJavaScriptVar: function(name, expression) {
                this.staticJavaScriptVars.push({name: name, expression: expression});
            },
            
            addRenderJavaScriptVar: function(name, expression) {
                this.renderJavaScriptVars.push({name: name, expression: expression});
            },
            
            _writeVars: function(vars, out) {
                if (!vars.length) {
                    return;
                } 
                out.append("var ");
                var declarations = [];
                forEach(vars, function(v) {
                    declarations.push(v.name + "=" + v.expression); 
                });
                out.append(declarations.join(",")  +";");
            },
            
            _endText: function() {
                var curText = this.curText; 
                if (curText) {
                    this.curText = null;
                    this.addWrite(stringify(curText, {useSingleQuote: true}));
                }
            },
            
            addText: function(text) {
                if (this.curText === null) {
                    this.curText = text;
                }
                else {
                    this.curText += text;
                }
            },
            
            _endWrites: function() {
                var curWrites = this.curWrites; 
                if (curWrites) {
                    this.curWrites = null;
//                    this.javaScriptCode.append('write(');
//                    this.javaScriptCode.append(curWrites.join(','));
//                    this.javaScriptCode.append(');\n');
                    
                    this.curWrites = null;
                    forEach(curWrites, function(curWrite, i) {
                        if (i === 0)
                        {
                            this.javaScriptCode.append('write(');
                        }
                        else {
                            this.javaScriptCode.append('(');
                        }
                        
                        this.javaScriptCode.append(curWrite);
                        this.javaScriptCode.append(')');
                    }, this);
                    
                    this.javaScriptCode.append(";");
                }
            },
            
            addWrite: function(expression, options) {
                //console.log('addWrite: ' + expression);
                this._endText();
                
                if (!this.curWrites) {
                    this.curWrites = [];
                }
                
                if (options) {
                    if (options.escapeXml) {
                        expression = this.getStaticHelperFunction("escapeXml", "x") + "(" + expression + ")";
                    }
                    if (options.escapeXmlAttr) {
                        expression = this.getStaticHelperFunction("escapeXmlAttr", "xa") + "(" + expression + ")";
                    }
                }
                this.curWrites.push(expression);
            },
            
            addJavaScriptCode: function(code) {
                //console.log('addJavaScriptCode: ' + code);
                
                this._endText();
                this._endWrites();
                this.javaScriptCode.append(code);
            },
            
            getOutput: function() {
                var out = strings.createStringBuilder();
                
                var templateName = this.getTemplateName();
                if (!templateName) {
                    errors.throwError(new Error("Template name not defined in template"));
                }
                
                var params = this.params;
                if (params) {
                    params = ["context"].concat(params);
                }
                else {
                    params = ["context"];
                }
                
                out.append('$rtmpl(');
                out.append(stringify(templateName));
                out.append(',');
                out.append('function(helpers){');
                //Write out the static variables
                this._writeVars(this.staticJavaScriptVars, out);
                out.append('return function(data, context, contextHelpers){\n');
                
                //Write out the render variables
                this._writeVars(this.renderJavaScriptVars, out);
                
                this._endText();
                this._endWrites();
                out.append(this.javaScriptCode.toString());
                out.append('}});');
                return out.toString();
            },
            
            setTemplateName: function(templateName) {
                this.templateName = templateName;
            },
            
            addTemplateParams: function(templateParams) {
                forEach(templateParams, function(param) {
                    this.addRenderJavaScriptVar(param, "data." + param);
                }, this);
            },
            
            makeExpression: function(expression) {
                if (expression instanceof Expression)  {
                    return expression;
                }
                else if (typeof expression === 'string') {
                    return new Expression(expression);
                }
                else {
                    errors.throwError(new Error("Unsupported expression object: " + expression));
                }
            },
            
            isExpression: function(expression) {
                return expression instanceof Expression;
            }
            
        };
        
        return TemplateBuilder;
    });
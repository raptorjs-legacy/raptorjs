/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

raptor.defineClass(
    'templating.compiler.TemplateBuilder',
    function(raptor) {
        "use strict";
        
        var INDENT = "  ";
        
        var stringify = raptor.require('json.stringify').stringify,
            strings = raptor.require('strings'),
            Expression = raptor.require('templating.compiler.Expression'),
            forEach = raptor.forEach;
        
        var TemplateBuilder = function(compiler, filePath) {
            this.filePath = filePath;
            this.compiler = compiler;
            this.options = compiler.options;
            this.templateName = null;
            this.curText = null;
            this.attributes = {};
            this.firstStatement = true;
            
            this.staticVars = [];
            this.staticVarsLookup = {};
            this.helperFunctionsAdded = {};
            
            this.vars = [];
            this.varsLookup = {};
            
            this.javaScriptCode = strings.createStringBuilder(); 
            
            this.getStaticHelperFunction("empty", "e");
            this.getStaticHelperFunction("notEmpty", "ne");
            
            this.preserveWhitespace = 0;
            
            
            this._indent = INDENT + INDENT;
        };
        
        TemplateBuilder.prototype = {            
            getTemplateName: function() {
                var options = this.options || {};
                return options.templateName || this.templateName || options.defaultTemplateName;
            },
            
            beginPreserveWhitespace: function() {
                this.preserveWhitespace++;
            },
            
            endPreserveWhitespace: function() {
                this.preserveWhitespace--;
            },
            
            isPreserveWhitespace: function() {
                var preserveWhitespace = this.options.preserveWhitespace;
                
                return this.preserveWhitespace > 0 || 
                    (preserveWhitespace === true) || 
                    (preserveWhitespace && preserveWhitespace["*"]);
            },

            _getHelperFunction: function(varName, propName, isStatic) {
                var key = propName + ":" + (isStatic ? "static" : "context");
                var added = this.helperFunctionsAdded[key];
                if (added) {
                    return added;
                }
                else {
                    if (isStatic) {
                        this.addStaticVar(varName, "helpers." + propName);
                    }
                    else {
                        this.addVar(varName, "contextHelpers." + propName);
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
            
            hasStaticVar: function(name) {
                return this.staticVarsLookup[name] === true;
            },
            
            addStaticVar: function(name, expression) {
                if (!this.staticVarsLookup[name]) {
                    this.staticVarsLookup[name] = true;
                    this.staticVars.push({name: name, expression: expression});    
                }
            },
            
            hasVar: function(name) {
                return this.vars[name] === true;
            },
            
            addVar: function(name, expression) {
                this.vars[name] = true;
                this.vars.push({name: name, expression: expression});
            },
            
            _writeVars: function(vars, out, indent) {
                if (!vars.length) {
                    return;
                } 
                out.append(indent + "var ");
                var declarations = [];
                forEach(vars, function(v, i) {
                    declarations.push((i !== 0 ? indent + "    " : "" ) + v.name + "=" + v.expression + (i === vars.length-1 ? ";\n" : ",\n")); 
                });
                out.append(declarations.join(""));
            },
            
            _endText: function() {
                
                if (this.hasErrors()) {
                    return;
                }
    
                var curText = this.curText; 
                if (curText) {
                    this.curText = null;
                    this.write(stringify(curText, {useSingleQuote: true}));
                }
            },
            
            addText: function(text) {
                if (this.hasErrors()) {
                    return;
                }
                
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
                    if (!this.firstStatement) {
                        this.javaScriptCode.append("\n");
                    }
                    
                    this.firstStatement = false;
                    
//                    this.curWrites = null;
//                    this.javaScriptCode.append('write(');
//                    this.javaScriptCode.append(curWrites.join(','));
//                    this.javaScriptCode.append(');\n');
                    
//                    this.curWrites = null;
//                    forEach(curWrites, function(curWrite, i) {
//                        if (i === 0)
//                        {
//                            this.javaScriptCode.append('write(');
//                        }
//                        else {
//                            this.javaScriptCode.append('(');
//                        }
//                        
//                        this.javaScriptCode.append(curWrite);
//                        this.javaScriptCode.append(')');
//                    }, this);
//                    
//                    this.javaScriptCode.append(";");
      
                    this.curWrites = null;
                    forEach(curWrites, function(curWrite, i) {
                        var methodName = curWrite[0],
                            argsString = curWrite[1],
                            thisObj = curWrite[2];
                        
                        if (i === 0)
                        {
                            this.javaScriptCode.append(this.indentStr() + 'context.' + methodName + "(");
                        }
                        else {
                            this.incIndent();
                            this.javaScriptCode.append(this.indentStr() + '.' + methodName + "(");
                        }
                        
                        if (typeof argsString === 'string') {
                            this.javaScriptCode.append(argsString);
                        }
                        else if (typeof argsString === 'function') {
                            argsString.call(thisObj);
                        }
                        else {
                            throw raptor.createError(new Error("Illegal state"));
                        }
                        
                        if (i < curWrites.length -1) {
                            this.javaScriptCode.append(")\n");      
                        }
                        else {
                            this.javaScriptCode.append(");\n");
                        }
                        if (i !== 0) {
                            this.decIndent();
                        }
                    }, this);
                    
//                    this.curWrites = null;
//                    forEach(curWrites, function(curWrite, i) {
//                        if (i === 0)
//                        {
//                            this.javaScriptCode.append('context.w(');
//                        }
//                        else {
//                            this.javaScriptCode.append('(');
//                        }
//                        
//                        this.javaScriptCode.append(curWrite);
//                        this.javaScriptCode.append(')');
//                    }, this);
//                    
//                    this.javaScriptCode.append(";\n");
                    
//                    this.curWrites = null;
//                    forEach(curWrites, function(curWrite, i) {
//                        this.javaScriptCode.append(this.indent() + 'context.w(');                        
//                        this.javaScriptCode.append(curWrite);
//                        this.javaScriptCode.append(');\n');
//                    }, this);
                }
            },
            
            attr: function(name, valueExpression) {
                if (!this.hasErrors()) {
                    this.addContextMethodCall("a", stringify(name) + "," + valueExpression);    
                }
    
                return this;
            },
            
            attrs: function(attrsExpression) {
                if (!this.hasErrors()) {
                    this.addContextMethodCall("a", attrsExpression);    
                }
    
                return this;
            },
            
            include: function(templateName, dataExpression) {
                if (!this.hasErrors()) {
                    this.addContextMethodCall("i", templateName + "," + dataExpression);    
                }
    
                return this;
            },
            
            write: function(expression, options) {
                if (!this.hasErrors()) {
                    if (options) {
                        if (options.escapeXml) {
                            expression = this.getStaticHelperFunction("escapeXml", "x") + "(" + expression + ")";
                        }
                        if (options.escapeXmlAttr) {
                            expression = this.getStaticHelperFunction("escapeXmlAttr", "xa") + "(" + expression + ")";
                        }
                    }
                    this.addContextMethodCall("w", expression);    
                }
    
                return this;
            },
            
            addContextMethodCall: function(methodName, argString, thisObj) {
                if (this.hasErrors()) {
                    return;
                }
    
                //console.log('write: ' + expression);
                this._endText();
                
                if (!this.curWrites) {
                    this.curWrites = [];
                }

                this.curWrites.push([methodName, argString, thisObj]);
            },
            
            incIndent: function() {
                this.emptyLine = false;
                this._endText();
                this._endWrites();
                
                this._indent += INDENT;
                
                this.firstStatement = true;
            },
            
            decIndent: function() {
                this.emptyLine = false;
                this._endText();
                this._endWrites();
                
                this._indent = this._indent.substring(INDENT.length);
                
                this.firstStatement = false;
            },
            
            code: function(code) {
                if (this.hasErrors()) {
                    return this;
                }

                this._endText();
                this._endWrites();
                
                this.javaScriptCode.append(code);
                
                return this;
            },
            
            statement: function(code) {
                this._endText();
                this._endWrites();
                
                this.code((this.firstStatement ? "" : "\n") + this._indent + code + "\n");
                
                this.firstStatement = false;
                return this;
            },
            
            line: function(code) {
                this.code(this._indent + code + "\n");
                return this;
            },
            
            indentStr: function(delta) {
                if (arguments.length === 0) {
                    return this._indent;
                }
                else {
                    var indent = this._indent;
                    for (var i=0; i<delta; i++) {
                        indent += INDENT;
                    }
                    return indent;
                }
            },
            
            indent: function() {
                if (arguments.length === 0) {
                    this.code(this._indent);
                }
                else if (typeof arguments[0] === 'number') {
                    this.code(this.indentStr(arguments[0]));
                }
                else if (typeof arguments[0] === 'function') {
                    var func = arguments[0],
                        thisObj = arguments[1];
                    
                    this.incIndent();
                    func.call(thisObj);
                    this.decIndent();
                }
                else if (typeof arguments[0] === 'string') {
                    this.code(this._indent + arguments[0]);
                }
                
                return this;
            },
            
            getOutput: function() {
                if (this.hasErrors()) {
                    return '';
                }
                
                var out = strings.createStringBuilder();
                
                var templateName = this.getTemplateName();
                if (!templateName) {
                    
                    this.addError('Template name not defined in template at path "' + this.filePath + '"');
                }
                
                var params = this.params;
                if (params) {
                    params = ["context"].concat(params);
                }
                else {
                    params = ["context"];
                }
                
                out.append('$rset("rhtml", ');
                out.append(stringify(templateName));
                out.append(', ');
                out.append('function(helpers) {\n');
                //Write out the static variables
                
                this._endText();
                this._endWrites();
                
                this._writeVars(this.staticVars, out, INDENT);
                out.append('\n' + INDENT + 'return function(data, context) {\n');
                
                
                //Write out the render variables
                if (this.vars && this.vars.length) {
                    this._writeVars(this.vars, out, INDENT + INDENT);
                    out.append("\n");    
                }
                
                
                this._endText();
                this._endWrites();
                out.append(this.javaScriptCode.toString());
                out.append(INDENT + '}\n});');
                return out.toString();
            },
            
            setTemplateName: function(templateName) {
                this.templateName = templateName;
            },
            
            makeExpression: function(expression) {
                if (expression instanceof Expression)  {
                    return expression;
                }
                else if (typeof expression === 'string') {
                    return new Expression(expression);
                }
                else {
                    throw raptor.createError(new Error("Unsupported expression object: " + expression));
                }
            },
            
            isExpression: function(expression) {
                return expression instanceof Expression;
            },
            
            getAttribute: function(name) {
                return this.attributes[name];
            },
            
            setAttribute: function(name, value) {
                this.attributes[name] = value;
                return value;
            },
            
            hasErrors: function() {
                return this.compiler.hasErrors();
            },
            
            addError: function(message, pos) {
                this.compiler.addError(message, pos);
            },
            
            getErrors: function() {
                return this.compiler.getErrors();
            },
            
            getNodeClass: function(uri, localName) {
                return this.compiler.getNodeClass(uri, localName);
            },
            
            INDENT: INDENT
            
        };
        
        return TemplateBuilder;
    });
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
    'templating.compiler.ExpressionParser',
    function(raptor) {
        "use strict";
        
        var Expression = raptor.require('templating.compiler.Expression'),
            strings = raptor.require('strings'),
            regexp = raptor.require('regexp'),
            endingTokens = {
//                "{": "}",
                "${": "}",
                "{%": "%}",
//                "{?": "}", //TODO Finish implementing short-hand conditionals
                "$": null
            },
            createStartRegExpStr = function(starts) {
                var parts = [];
                
                raptor.forEach(starts, function(start) {
                    parts.push(regexp.escape("\\\\" + start));
                    parts.push(regexp.escape("\\" + start));
                    parts.push(regexp.escape(start));
                });
                
                return parts.join("|");
            },
            startRegExpStr = createStartRegExpStr(["{%", "${", "$"/*, "{?"*/]),
            createStartRegExp = function() {
                return new RegExp(startRegExpStr, "g");
            },
            variableRegExp = /^([_a-zA-Z]\w*)/g,
            getLine = function(str, pos) {
                var lines = str.split("\n");
                var index = 0;
                
                var line;
                
                while (index < lines.length) {
                    line = lines[index];
                    if (pos - line.length+1 < 0) {
                        break;
                    }
                    else {
                        pos -= line.length+1;
                    }
                    index++;
                }
                
                return {
                    str: line,
                    pos: pos
                };
            },
            errorContext = function(str, pos, length) {
                
                var line = getLine(str, pos);
                pos = line.pos;
                str = line.str;
                
                var start = pos - length,
                    end = pos + length,
                    i;
                
                if (start < 0) {
                    start = 0;
                }
                
                if (end > str.length) {
                    end = str.length;
                }
                
                var prefix = "...";
                var suffix = "...";
                
                var context = "\n" + prefix + str.substring(start, end) + suffix + "\n";
                for (i=0; i<prefix.length; i++) {
                    context += " ";
                }
                for (i=start; i<end; i++) {
                    context += i === pos ? "^" : " ";
                }
                for (i=0; i<suffix.length; i++) {
                    context += " ";
                }
                return context;
            };
        
            
        /**
         * 
         */
        var ExpressionParserHelper = raptor.defineClass(function() {
            return {
                init: function(callback, callbackThisObj) {
                    this.callback = callback;
                    this.callbackThisObj = callbackThisObj;
                    
                    this.text = '';
                },
                
                _invokeCallback: function(name, arg) {
                    if (!this.callback[name]) {
                        raptor.throwError(new Error(name + " not allowed: " + arg));
                    }
                    
                    this.callback[name].call(this.callbackThisObj, arg);
                },
                
                _endText: function() {
                    if (this.text) {
                        this._invokeCallback("text", this.text);
                        this.text = '';
                    }
                },
                
                add: function(type, value) {
                    if (type === 'text') {
                        this.addText(value);
                    }
                    else {
                        this._endText();
                        this._invokeCallback(type, value);    
                    }
                },
                
                /**
                 * 
                 * @param newText
                 * @returns
                 */
                addText: function(newText) {
                    this.text += newText;
                },
                
                /**
                 * 
                 * @param expression
                 * @returns
                 */
                addExpression: function(expression) {
                    this._endText();
                    
                    
                    if (!(expression instanceof Expression)) {
                        expression = new Expression(expression);
                    }

                    this._invokeCallback("expression", expression);
                },
                
                /**
                 * 
                 * @param scriptlet
                 * @returns
                 */
                addScriptlet: function(scriptlet) {
                    this._endText();
                    this._invokeCallback("scriptlet", scriptlet);
                }
            };
        });
            
        var ExpressionParser = function() {
            
        };
        
        ExpressionParser.getConditionalExpression = function() {
            
        },
        
        /**
         * @memberOf templating.compiler$ExpressionParser
         * 
         * @param str
         * @param callback
         * @param thisObj
         */
        ExpressionParser.parse = function(str, callback, thisObj, options) {
            if (!options) {
                options = {};
            }
            
            var textStart = 0, //The index of the start of the next text block
                textEnd, //The index of the current text block
                startMatches, //The matches found when searching for the possible start tokens
                endMatches, //The matches found when searching through special expression tokens
                expressionStart, //The index of the start of the current expression
                expression, //The current expression string
                isScriptlet, //If true, then the expression is a scriptlet,
                isConditional, //If true, then the expression is a conditional (i.e. {?<expression>;<true-template>[;<false-template>]}
                startToken, //The start token for the current expression
                custom = options.custom || {},
                handleError = function(message) {
                    if (callback.error) {
                        callback.error.call(thisObj, message);
                        return;
                    }
                    else {
                        raptor.throwError(new Error(message));
                    }
                };
                
            var startRegExp = createStartRegExp();
            
            var helper = new ExpressionParserHelper(callback, thisObj);
            
            startRegExp.lastIndex = 0;
            
            /*
             * Look for any of the possible start tokens (including the escaped and double-escaped versions)
             */
            outer:
            while((startMatches = startRegExp.exec(str))) {
                
                if (strings.startsWith(startMatches[0], "\\\\")) { // \\${
                    /*
                     * We found a double-escaped start token.
                     * 
                     * We found a start token that is preceeded by an escaped backslash...
                     * The start token is a valid start token preceded by an escaped
                     * backslash. Add a single black slash and handle the expression
                     */
                    textEnd = startMatches.index + 1; //Include everything up to and include the first backslash as part of the text
                    startToken = startMatches[0].substring(2); //Record the start token
                    expressionStart = startMatches.index + startMatches[0].length; //The expression starts after the start token
                }
                else if (strings.startsWith(startMatches[0], "\\")) { // \${
                    /*
                     * We found a start token that is escaped. We should
                     * add the unescaped start token to the text output.
                     */
                    helper.addText(str.substring(textStart, startMatches.index)); //Add everything preceeding the start token
                    helper.addText(startMatches[0].substring(1)); //Add the start token excluding the initial escape character
                    textStart = startRegExp.lastIndex; // The next text block we find will be after this match
                    continue;
                }
                else if (endingTokens.hasOwnProperty(startMatches[0])) {
                    /*
                     * We found a valid start token 
                     */
                    startToken = startMatches[0]; //Record the start token
                    textEnd = startMatches.index; //The text ends where the start token begins
                }
                else {
                    raptor.throwError(new Error("Illegal state. Unexpected start token: " + startMatches[0]));
                }

                expressionStart = startRegExp.lastIndex; //Expression starts where the start token ended

                if (textStart !== textEnd) { //If there was any text between expressions then add it now
                    helper.addText(str.substring(textStart, textEnd));
                }
                
                var endToken = endingTokens[startToken]; //Look up the end token
                if (!endToken) { //Check if the start token has an end token... not all start tokens do. For example: $myVar
                    variableRegExp.lastIndex = 0;
                    var variableMatches = variableRegExp.exec(str.substring(expressionStart)); //Find the variable name that follows the starting "$" token
                    
                    if (!variableMatches) { //We did not find a valid variable name after the starting "$" token
                        //handleError('Invalid simple variable expression. Location: ' + errorContext(str, expressionStart, 10)); //TODO: Provide a more helpful error message
                        helper.addText(startMatches[0]);
                        startRegExp.lastIndex = textStart = expressionStart;
                        continue outer;
                    }
                    
                    var varName = variableMatches[1];
                    helper.addExpression(varName); //Add the variable as an expression
                    startRegExp.lastIndex = textStart = expressionStart = expressionStart + varName.length;
                    
                    continue outer;
                }
                
                
                isScriptlet = startToken === "{%";
                isConditional = startToken === '{?';
                
                var endRegExp = /"(?:[^"]|\\")*"|'(?:[^']|\\')*'|\%\}|[\{\}]/g;
                //Now we need to find the ending curly
                endRegExp.lastIndex = expressionStart; //Start searching from where the expression begins
                
                var depth = 0;
                
                while((endMatches = endRegExp.exec(str))) {
                    if (endMatches[0] === '{') {
                        depth++;
                        continue;
                    }
                    else if (endMatches[0] === '}') {
                        if (isScriptlet) {
                            continue;
                        }
                        
                        if (depth !== 0) {
                            depth--;
                            continue;
                        }
                    }
                    else if (endMatches[0] === '%}') {
                        if (!isScriptlet) {
                            handleError('Ending "' + endMatches[0] + '" token was found but matched with starting "' + startToken + '" token. Location: ' + errorContext(str, endMatches.index, 10));
                        }
                    }
                    else {
                        continue;
                    }
                    
                    //console.log("EXPRESSION: " + str.substring(firstCurly+1, endMatches.index));
                    expression = str.substring(expressionStart, endMatches.index);
                    
                    
                    var handler;
                    
                    if (startToken === "${") {
                        var firstColon = expression.indexOf(":"),
                            customType;
                        if (firstColon != -1) {
                            customType = expression.substring(0, firstColon);
                            
                            handler = custom[customType] || ExpressionParser.custom[customType];
                            if (handler) {
                                handler.call(ExpressionParser, expression.substring(firstColon+1), helper);
                            }
                        }
                    }
                    
                    
                    if (!handler) {
                        if (isScriptlet) {
                            helper.addScriptlet(strings.trim(expression));
                        }
                        else if (isConditional) {
                            helper.addExpression(this.getConditionalExpression(expression));
                        }
                        else {
                            helper.addExpression(expression);
                        }
                        
                    }
                    
                    startRegExp.lastIndex = endRegExp.lastIndex; //Start searching from where the end token ended
                    textStart = endRegExp.lastIndex;
                    
                    //console.log('Found ending curly. Start index now: ' + searchStart);
                    continue outer;
                    
                }
                
                handleError('Ending "' + endingTokens[startToken] + '" token not found for "' + startToken + '" token. Location: ' + errorContext(str, startMatches.index, 10) + "\n");
            }
            
            if (textStart !== str.length) {
                helper.addText(str.substring(textStart, str.length));
            }
            
            //console.log("Loop ended");
            helper._endText();
        };
        
        ExpressionParser.custom = {
            "xml": function(expression, helper) {
                expression = new Expression(expression);
                expression.escapeXml = false;
                helper.addExpression(expression);
            },
            "entity": function(expression, helper) {
                helper.addText("&" + expression + ";");
            },
            "startTag": function(expression, helper) {
                helper.addText("<" + expression + ">");
            },
            "endTag": function(expression, helper) {
                helper.addText("</" + expression + ">");
            },
            "newline": function(expression, helper) {
                helper.addText("\n");
            }
        };
        
        return ExpressionParser;
    });
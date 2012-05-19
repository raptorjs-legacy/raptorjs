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
        
        var endRegExp = /"(?:[^"]|\\")*"|'(?:[^']|\\')*'|\%\}|[\{\}]/g,
            Expression = raptor.require('templating.compiler.Expression'),
            strings = raptor.require('strings'),
            regexp = raptor.require('regexp'),
            endingTokens = {
//                "{": "}",
                "${": "}",
                "{%": "%}",
                "$": null
            },
            createStartRegExp = function(starts) {
                var parts = [];
                
                raptor.forEach(starts, function(start) {
                    parts.push(regexp.escape("\\\\" + start));
                    parts.push(regexp.escape("\\" + start));
                    parts.push(regexp.escape(start));
                });
                
                return new RegExp(parts.join("|"), "g");
            },
            startRegExp = createStartRegExp(["{%", "${", "$"]),
            variableRegExp = /([_a-zA-Z]\w*)/g,
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
        
        /**
         * @memberOf templating.compiler$ExpressionParser
         * 
         * @param str
         * @param callback
         * @param thisObj
         */
        ExpressionParser.parse = function(str, callback, thisObj) {
            var searchStart = 0,
                textStart = 0,
                textEnd,
                startMatches,
                endMatches,
                expressionStart,
                expression,
                isScriptlet,
                startToken;
            
            var helper = new ExpressionParserHelper(callback, thisObj);
            
            startRegExp.lastIndex = 0;
            
            outer:
            while((startMatches = startRegExp.exec(str))) {
                
                if (!startMatches) {
                    helper.addText(str.substring(textStart, str.length));
                    textStart = str.length;
                    break;
                }
                else if (strings.startsWith(startMatches[0], "\\\\")) { // \\{ or \\${
                    //We found a start token that is preceeded by an escaped backslash... Add a black slash and handle the expression
                    textEnd = startMatches.index + 1;
                    startToken = startMatches[0].substring(2); //Record the start token
                    expressionStart = startMatches.index + startMatches[0].length;
                }
                else if (strings.startsWith(startMatches[0], "\\")) { // \{
                    //We found a start token that is escaped... it needs to be added as text
                    helper.addText(str.substring(textStart, startMatches.index));
                    helper.addText(startMatches[0].substring(1));
                    textStart = startRegExp.lastIndex;
                    continue;
                }
                else if (startMatches[0] == "{%" || startMatches[0] == "${" || startMatches[0] == "{" || startMatches[0] == "$") {
                    startToken = startMatches[0];
                    textEnd = startMatches.index;
                }
                else {
                    searchStart += startMatches.index + startMatches[0].length;
                    continue;
                }

                expressionStart = startRegExp.lastIndex; //Expression starts where the start token ended

                if (textStart !== textEnd) {
                    helper.addText(str.substring(textStart, textEnd));
                }
                
                var endToken = endingTokens[startToken];
                if (!endToken) {
                    variableRegExp.lastIndex = expressionStart;
                    var variableMatches = variableRegExp.exec(str);
                    if (!variableMatches) {
                        raptor.throwError('Invalid expression "$' + str.substring(expressionStart) + '"');
                    }
                    helper.addExpression(variableMatches[1]);
                    
                    startRegExp.lastIndex = textStart = variableMatches.index + variableMatches[1].length; //Start searching from where the end token ended
                    
                    //console.log('Found ending curly. Start index now: ' + searchStart);
                    continue outer;
                }
                
                
                isScriptlet = startToken === "{%";
                
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
                            raptor.throwError(new Error('Ending "' + endMatches[0] + '" token was found but matched with starting "' + startToken + '" token. Location: ' + errorContext(str, endMatches.index, 10)));
                        }
                    }
                    else {
                        continue;
                    }
                    
                    //console.log("EXPRESSION: " + str.substring(firstCurly+1, endMatches.index));
                    expression = str.substring(expressionStart, endMatches.index);
                    
                    
                    var firstColon = !isScriptlet ? expression.indexOf(":") : -1,
                        handler;
                    if (firstColon != -1) {
                        handler = ExpressionParser.custom[expression.substring(0, firstColon)];
                        if (handler) {
                            handler.call(ExpressionParser, expression.substring(firstColon+1), helper);
                        }
                    }
                    
                    if (!handler) {
                        if (isScriptlet) {
                            helper.addScriptlet(strings.trim(expression));
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
                
                raptor.throwError(new Error('Invalid expression. Ending "' + endingTokens[startToken] + '" token not found for "' + startToken + '" token. Location: ' + errorContext(str, startMatches.index, 10)));
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
            }
        };
        
        return ExpressionParser;
    });
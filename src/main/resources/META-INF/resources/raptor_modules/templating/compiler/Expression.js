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
    'templating.compiler.Expression',
    function() {
        "use strict";
        
        var operatorsRegExp = /"(?:[^"]|\\")*"|'(?:[^']|\\')*'|\s+(?:and|or|lt|gt|eq|ne|lt|gt|ge|le)\s+/g,
            strings = raptor.require('strings'),
            replacements = {
                "and": " && ",
                "or": " || ",
                "eq": " === ",
                "ne": " !== ",
                "lt": " < ",
                "gt": " > ",
                "ge": " >= ",
                "le": " <= "
            },
            handleBinaryOperators = function(str) {
                return str.replace(operatorsRegExp, function(match) {
                    return replacements[strings.trim(match)] || match;
                });
            };
        
        var Expression = function(expression, replaceSpecialOperators) {

            if (replaceSpecialOperators !== false && typeof expression === 'string') {
                expression = handleBinaryOperators(expression);
            }

            try {
                eval('var func = function() { return ' + expression + ';};');
                this.expression = expression;
            }
            catch(e) {
                throw new Error('Invalid expression "' + expression + '" - ' + e.message);
            }
            
        };
        
        Expression.prototype = {
            /**
             * 
             * @returns
             */
            getExpression: function() {
                return this.expression;
            },
            
            /**
             */
            toString: function() {
                return this.expression;
            }
        };
        
        return Expression;
    });
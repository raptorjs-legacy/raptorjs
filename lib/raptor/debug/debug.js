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

$rload(function(raptor) {
    "use strict";
    
    

    var INDENT_STR = "  ",
        indent = function(depth) {
            var indent = ""; 
            
            for (var i=0;i<depth;i++) { 
                indent += INDENT_STR;
            } 
            return indent; 
        },
        prettyPrintHelper = function(o, indent, depth, options) {
            var ret;
            
            if (o === null) {
                return "null";
            }
            else if (o === undefined) {
                return "undefined";
            }
            else if (typeof o === 'string') {
                return raptor.require('json.stringify').stringify(o, {useSingleQuote: true});
            }
            else if (typeof o == 'function') {
                return options.includeFunctions !== false ? ("" + o).replace(/\r|\n|\r\n/g, "\n" + indent) : "(function)";
            }
            else if (raptor.isArray(o)) {

                if (depth > options.maxDepth)
                {
                    ret = '[(max depth exceeded)]';
                    return ret;
                }
                else
                {
                    var len = o.length;
                    ret = "[\n";
                    for (var i=0; i<len; i++) {
                        ret += indent + INDENT_STR + prettyPrintHelper(o[i], indent + INDENT_STR, depth+1, options);
                        if (i < len - 1)
                        {
                            ret += ',';
                        }
                        ret += '\n';
                    }
                    ret += indent + ']';
                    return ret;
                }
            }
            else if (typeof o === 'object') {
                if (depth > options.maxDepth)
                {
                    ret = '{(max depth exceeded)}';
                    return ret;
                }
                else
                {
                    var keys = [];
                    
                    for (var key in o) {
                        if (options.allProps || o.hasOwnProperty(key)) {
                            keys.push(key);
                        }
                    }

                    ret = "{\n";
                    for (var j=0; j<keys.length; j++) {
                        var k = keys[j];
                        var value = o[k];
                        ret += indent + INDENT_STR + k + ": " + prettyPrintHelper(value, indent + INDENT_STR, depth+1, options);
                        if (j < keys.length - 1)
                        {
                            ret += ',';
                        }
                        ret += '\n';
                    }

                    ret += indent + '}';
                    return ret;
                }
            }
            else {
                return o.toString();
            }
        };
    
    /**
     * @namespace
     * @raptor
     * @name debug
     */
    raptor.debug = {

        /**
         * @static
         */
        prettyPrint: function(o, options)
        {
            return prettyPrintHelper(o, "", 1, options || {});
        }
    };    
});
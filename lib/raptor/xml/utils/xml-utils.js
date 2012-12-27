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

define(
    'raptor/xml/utils',
    function(require, exports, module) {
        "use strict";
        
        var elTest = /[&<]/,
            elTestReplace = /[&<]/g,
            attrTest = /[&<>\"\'\n]/,
            attrReplace = /[&<>\"\'\n]/g,
            replacements = {
                '<': "&lt;",
                '>': "&gt;",
                '&': "&amp;",
                '"': "&quot;",
                "'": "&apos;",
                '\n': "&#10;" //Preserve new lines so that they don't get normalized as space
            };
        
        return {
            escapeXml: function(str) {
                if (typeof str === 'string' && elTest.test(str)) {
                    return str.replace(elTestReplace, function(match) {
                        return replacements[match];
                    });
                }
                return str;
            },
            
            escapeXmlAttr: function(str) {
                if (typeof str === 'string' && attrTest.test(str)) {
                    return str.replace(attrReplace, function(match) {
                        return replacements[match];
                    });
                }
                return str;
            }
        };
    });
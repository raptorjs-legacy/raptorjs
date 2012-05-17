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

raptor.defineModule(
    'xml.utils',
    function(raptor) {
        "use strict";
        
        var extend = raptor.extend,
            specialRegExp = /(\n|\"|[&<>]|[^\u0020-\}])/g,
            attrReplacements = {
                '<': "&lt;",
                '>': "&gt;",
                '&': "&amp;",
                '"': "&quot;",
                '\n': "&#" + "\n".charCodeAt(0) + ";"
            },
            elReplacements = extend(extend({}, attrReplacements), {
                "\n": "\n" 
            }),
            escapeXml = function(str, replacements) {
                if (str == null) return null;
                if (typeof str !== "string") {
                    return str;
                }
                
                return str.replace(specialRegExp, function(match) {
                    var replacement = replacements[match];
                    return replacement || ("&#" + match.charCodeAt(0) + ";");
                });
            };
        
        return {
            escapeXml: function(str) {
                return escapeXml(str, elReplacements);
            },
            
            escapeXmlAttr: function(str) {
                if (!str) {
                    return str;
                }
                return escapeXml('' + str, attrReplacements);
            }
        };
    });
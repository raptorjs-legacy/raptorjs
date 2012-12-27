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
    'raptor/xml/sax',
    function(require, exports, module) {
        "use strict";
        
        return {
            
            /**
             * 
             * @param options
             * @returns
             */
            createParser: function(options) {
                options = options || {};
                
                if (options.dom) {
                    return this.createParserForDom(options);
                }
                
                var SaxParser = require.find('raptor/xml/SaxParser') || require.find('raptor/xml/sax/SaxParserDom');
                return new SaxParser(options);
            },
            
            createParserForDom: function(options) {
                var SaxParser = require('raptor/xml/sax/SaxParserDom');
                return new SaxParser(options);
            }
        };
        
    });
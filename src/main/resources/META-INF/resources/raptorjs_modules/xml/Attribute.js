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
    "xml.Attribute",
    function(raptor) {
        var Attribute = function(uri, localName, qName, prefix, value) {
        };
        
        Attribute.prototype = {
                
            /**
             * 
             * @returns
             */
            getURI: function() {
                return this.uri;
            },
            
            /**
             * 
             * @returns
             */
            getLocalName: function() {
                return this.localName;
            },
            
            /**
             * 
             * @returns
             */
            getQName: function() {
                return this.qName;
            },
            
            /**
             * 
             * @returns
             */
            getValue: function() {
                return this.value;
            }
        };
        
        return Attribute;
    });
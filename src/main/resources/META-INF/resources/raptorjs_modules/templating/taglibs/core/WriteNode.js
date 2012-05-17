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
    'templating.taglibs.core.WriteNode',
    'templating.compiler.Node',
    function() {
       
        var WriteNode = function(props) {
            WriteNode.superclass.constructor.call(this, 'write');
            
            if (props) {
                this.setProperties(props);
            }
        };
        
        WriteNode.prototype = {   
                
            doGenerateCode: function(template) {
                var expression = this.getProperty("expression") || this.getProperty("value"),
                    escapeXml = this.getProperty("escapeXml") !== false;
                
                if (expression) {
                    template.addWrite(expression, {escapeXml: escapeXml});
                }
            },
            
            
            toString: function() {
                return '[<c:write expression="' + this.getProperty('expression') + '"]';
            }
        };
        
        return WriteNode;
    });
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
    'templating.taglibs.core.ChooseNode',
    'templating.compiler.Node',
    function(raptor) {
        "use strict";
        
        var strings = raptor.require("strings"),
            WhenNode = raptor.require('templating.taglibs.core.WhenNode'),
            OtherwiseNode = raptor.require('templating.taglibs.core.OtherwiseNode');
        
        var ChooseNode = function(props) {
            ChooseNode.superclass.constructor.call(this);
        };
        
        ChooseNode.prototype = {
            
            doGenerateCode: function(template) {
                var otherwiseNode = null,
                    foundWhenNode = false;
                
                this.forEachChild(function(child) {

                    if (child.isTextNode()) {
                        if (!strings.isEmpty(child.getText())) {
                            raptor.throwError(new Error('Static text "' + strings.trim(child.getText()) + '" is not allowed in ' + this.toString() + " tag."));
                        }
                    }
                    else if (child.getNodeClass() === WhenNode){
                        if (otherwiseNode) {
                            raptor.throwError(new Error(otherwiseNode + ' tag must be last child of tag ' + this + '.'));
                        }
                        
                        if (!foundWhenNode) {
                            foundWhenNode = true;
                            child.firstWhen = true;
                        }
                        
                        child.generateCode(template);
                        
                    }
                    else if (child.getNodeClass() === OtherwiseNode) {
                        if (otherwiseNode) {
                            raptor.throwError(new Error('More than one ' + otherwiseNode + ' tag is not allowed as child of tag ' + this + '.'));
                        }
                        
                        otherwiseNode = child;
                        
                        child.generateCode(template);
                    }
                    else {
                        raptor.throwError(new Error(child + ' tag is not allowed as child of tag ' + this + '.'));
                    }
                }, this);
                
                if (!foundWhenNode) {
                    raptor.throwError(new Error('' + otherwiseNode + ' tag is required to have at least one <c:when> child.'));
                }
            }
            
        };
        
        return ChooseNode;
    });
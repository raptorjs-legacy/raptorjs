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
    "templating.taglibs.widgets.WidgetsTagTransformer",
    function(raptor) {
        "use strict";
        
        var widgetsNS = "http://raptor.ebayopensource.org/widgets";
        
        return {
            process: function(node, compiler, template) {
                
                var id;
                
                if ((id = node.getPropertyNS(widgetsNS, "id")) != null) {
                    
                    
                    var widgetsData = template.attributes[widgetsNS];
                    if (!widgetsData) {
                        widgetsData = template.attributes[widgetsNS] = {};
                    }
                    
                    if (!widgetsData.docVarAdded) {
                        template.addRenderJavaScriptVar("widgetDoc", "context.widgetDoc()");
                        widgetsData.docVarAdded = true;
                    }
                    
                    node.setPropertyNS(widgetsNS, "doc", template.makeExpression("widgetDoc"));
                }
            }
        };
    });
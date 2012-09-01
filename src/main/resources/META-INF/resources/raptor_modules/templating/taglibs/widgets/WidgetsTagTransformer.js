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
        
        var widgetsNS = "http://raptorjs.org/templates/widgets";
        
        return {
            process: function(node, compiler, template) {
                var id,
                    widgetAttr;
//                var widgetProps = node.getPropertiesNS(widgetsNS);;
//                if (widgetProps) {
//                    raptor.forEachEntry(function(name, value) {
//                        if (name === 'id') {
//                            
//                        }
//                    })
//                }
//                
//                if ((id = node.getPropertyNS(widgetsNS, "id"))) {
//                    node.removePropertyNS(widgetsNS, "id");
//                    widgetProps[id] = id;
//                }
                
                if ((id = node.getPropertyNS(widgetsNS, "id"))) {
                    node.removePropertyNS(widgetsNS, "id");
                    node.setProperty("widgetArgs", template.makeExpression("[widget, " + id + "]"));
                }
                
                if ((widgetAttr = node.getAttributeNS(widgetsNS, "widget"))) {
                    node.removeAttributeNS(widgetsNS, "widget");
                    
                    var widgetNode = compiler.createTagHandlerNode(widgetsNS, "widget");
                    node.parentNode.replaceChild(widgetNode, node);
                    widgetNode.appendChild(node);
                    widgetNode.setProperty("jsClass", widgetAttr);
                    
                    var elId = node.getAttribute("id");
                    if (elId) {
                        elId = compiler.convertType(elId, "string", true);
                        widgetNode.setProperty("id", elId);
                    }
                    else {
                        node.setAttribute('id', '${widget.elId()}');
                    }
                }
            }
        };
    });
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

/**
* @extension Server
* 
*/
raptor.extend('widgets', function(raptor) {
    "use strict";
    
    var stringify = raptor.require('json.stringify').stringify;
    
    return {
        
        writeInitWidgetsCode: function(context, clearWidgets) {
            var attributes = context.attributes,
                widgets = attributes.widgets;
            
            if (!widgets) {
                return;
            }
            
            var write = function(str) {
                    context.write(str);
                },
                writeWidgets = function(widgets) {
                    for (var i=0, len=widgets.length; i<len; i++) {
                        if (i) {
                            write(',');
                        }
                        writeWidget(widgets[i]);

                    }
                },
                writeWidget = function(widget) {
                    write('["');
                    write(widget.type);
                    write('","');
                    write(widget.id);
                    write('",');
                    write(widget.docId != null ? widget.docId : "0");
                    write(',');
                    write(widget.nestedDocId != null ? widget.nestedDocId : "0");
                    write(',');
                    write(widget.childId ? ('"' + widget.childId + '"') : "0");
                    write(',');
                    write(widget.config ? stringify(widget.config) : "0");
                    if (widget.children.length) {
                        write(',');
                        writeWidgets(widget.children);
                    }
                    write(']');
                };
            
            write("$rwidgets(");
            writeWidgets(widgets);
            write(");");
            
            if (clearWidgets !== false) {
                attributes.widgets = [];
            }
        },
        
        _nextWidgetId: function(context) {
            var attributes = context.attributes;
            if (!attributes.nextWidgetId) {
                attributes.nextWidgetId = 0;
            }
            return 's' + attributes.nextWidgetId++;
        }
    };
});

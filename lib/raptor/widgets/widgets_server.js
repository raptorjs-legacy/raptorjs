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
define.extend('raptor/widgets', function(require) {
    "use strict";
    
    var stringify = require('raptor/json/stringify'),
        specialRegExp = /([^ -~]|(["'\\<]))/g;
    
    return {
        
        writeInitWidgetsCode: function(context, clearWidgets) {
            var widgetsContext = this.getWidgetsContext(context),
                widgets = widgetsContext.widgets;
            
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
                    
                    var widgetConfig = widget.config;

                    write('\n["');
                    write(widget.type);
                    write('","');
                    write(widget.id);
                    write('",');
                    write(widgetConfig ? stringify(widgetConfig, {special: specialRegExp}) : "0");
                    write(widget.scope ? (',"' + widget.scope.id + '"') : ",0");
                    write(widget.assignedId ? (',"' + widget.assignedId + '"') : ",0");
                    if (widget.events) {
                        write(',[');
                        widget.events.forEach(function(event) {
                            write('["' + event[0] + '","' + event[1] + (event[2] != null ? '",' + stringify(event[2]) + ']' : '"]'));
                        });
                        write(']');
                    }
                    else {
                        write(',0');    
                    }
                    
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
                widgetsContext.clearWidgets();
            }
        },
        
        _nextWidgetId: function(context) {
            var attributes = context.getAttributes();
            if (!attributes.nextWidgetId) {
                attributes.nextWidgetId = 0;
            }
            return 's' + attributes.nextWidgetId++;
        }
    };
});

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
* Module to manage the lifecycle of widgets
* 
*/
raptor.define('widgets', function(raptor) {
    "use strict";

    var WidgetDef = function(id, type, nestedWidgetId, config, parent) {
        this.type = type;
        this.id = id;
        this.nestedWidgetId = nestedWidgetId;
        this.config = config;
//        this.nestedDocId = null;
//        this.docId = null;
        this.parent = parent;
        this.children = [];
        if (parent) {
            parent.children.push(this);
        }
    };

    WidgetDef.prototype = {
        elId: function(name) {
            if (arguments.length === 0) {
                return this.id;
            }
            else {
                return this.id + "-" + name;
            }
        }
    };
    
    return {
        addWidget: function(type, widgetId, nestedWidgetId, config, parent, context) {
            
            if (!widgetId) {
                widgetId = this._nextWidgetId(context);
            }
            
            var widgetDef = new WidgetDef(widgetId, type, nestedWidgetId, config, parent);
            
            if (nestedWidgetId) {
                if (!parent) {
                    raptor.throwError(new Error("Widget with an assigned ID is not scoped within another widget."));
                }
                widgetDef.docId = parent.id;
            }
            
            
            if (!parent) {
                var attributes = context.attributes;
                if (!attributes.widgets) {
                    attributes.widgets = [];
                }
                attributes.widgets.push(widgetDef); 
            }
            
            
            return widgetDef;
        },
        
        hasWidgets: function(context) {
            var attributes = context.attributes;
            return attributes.widgets && attributes.widgets.length !== 0;
        },
        
        _nextDocId: function(context) {
            var attributes = context.attributes;
            if (!attributes.nextDocId) {
                attributes.nextDocId = 1;
            }
            return attributes.nextDocId++;
        }
    };
});

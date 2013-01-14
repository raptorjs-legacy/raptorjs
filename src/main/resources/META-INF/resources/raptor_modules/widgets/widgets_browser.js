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
* @extension Browser
* 
*/
raptor.extend('widgets', function(raptor, widgets) {
    "use strict";
    
    var PROTOTYPE = 'prototype',
        widgetsById = {},
        listeners = raptor.listeners,
        EVENTS = 'events',
        Widget = raptor.require('widgets.Widget'),
        arrayFromArguments = raptor.arrayFromArguments,
        nextWidgetId = 0;
    
    /**
     * The Documentation groups up all widgets rendered in the same template documentat.
     * 
     * @class
     * @anonymous
     *  
     */
    var Document = function(widget) {
        this.widget = widget;
        this.widgetsById = {};
    };
    
    /**
     * 
     */
    Document.prototype = {
        /**
         * 
         * @param widget
         * @param id
         */
        addWidget: function(widget, id) {
            var existing = this.widgetsById[id],
                docWidget = this.widget,
                isArray;
            
            if (id.length > 2 && id.substring(id.length-2) === '[]') {
                id = id.slice(0, -2);
                isArray = true;
            }
            
            if (!existing) {
                this.widgetsById[id] = [widget];
            }
            else {
                existing.push(widget);
            }
            
            if (isArray) {
                (docWidget[id] || (docWidget[id] = [])).push(widget);
            }
            else {
                docWidget[id] = widget;
            }
        },
        
        /**
         * 
         * @param id
         * @returns
         */
        getWidget: function(id) {
            var matching = this.widgetsById[id];
            if (!matching || matching.length === 0) return undefined;
            if (matching.length === 1) return matching[0];
            throw raptor.createError(new Error('getWidget: Multiple widgets found with ID "' + id + '"'));
        },
        
        /**
         * 
         * @param id
         * @returns {Boolean}
         */
        getWidgets: function(id) {
            return this.widgetsById[id] || [];
        }
    };

    return {
        /**
         * 
         * @param {...widgets} widgets An array of widget definitions
         * @returns {void}
         */
        _initAll: function(widgetDefs) {
            var logger = this.logger(),
                docs = {};
            
            var _initWidget = function(widget, config, type) {
                    try
                    {
                        
                        if (widget.initWidget) {
                            widget.initWidget(config);
                        }
                        else {
                            widget.init(config);
                        }
                        
                    }
                    catch(e) {
                        logger.error('Unable to initialize widget of type "' + type + "'. Exception: " + e, e);
                    }
                },
                _initWidgetOnReady = function(widget, config, type) {
                    widget.onReady(function() {
                        _initWidget(widget, config, type);
                    });
                },
                
                _notify = function(name, args) {
                    return this.publish(name, arrayFromArguments(arguments, 1));
                },
                _convertEvents = function(events) {
                    var convertedEvents = {};
                    raptor.forEach(events, function(event) {
                        convertedEvents[event[0]] = {
                            target: event[1],
                            props: event[2]
                        };
                    }, this);
                    return convertedEvents;
                },
                _initWidgets = function(widgetDefs, parentWidget) {
                    if (!widgetDefs) return;
                    
                    var i=0,
                        len = widgetDefs.length,
                        widget;
                    
                    for (; i<len; i++) {
                        
                        var widgetDef = widgetDefs[i], 
                            type = widgetDef[0],
                            id = widgetDef[1],
                            scope = widgetDef[2],
                            assignedId = widgetDef[3],
                            config = widgetDef[4] || {},
                            events = widgetDef[5] || {},
                            children = widgetDef.slice(6);
                        
                        if (scope === 0) {
                            scope = undefined;
                        }
                            
                        if (assignedId === 0) {
                            assignedId = undefined;
                        }
                        
                        if (config === 0) {
                            config = undefined;
                        }
                        
                        logger.debug('Creating widget of type "' + type + '" (' + id + ')');
                        
                        var originalWidgetClass = raptor.find(type);
                        if (!originalWidgetClass)
                        {
                            throw raptor.createError(new Error('Unable to initialize widget of type "' + type + '". The class for the widget was not found.'));
                        }
                        
                        if (events) {
                            events = _convertEvents(events);
                        }
                        
                        
                        if (originalWidgetClass.initWidget) {
                            config.elId = id;
                            config.events = events;
                            widget = originalWidgetClass;
                            widget.onReady = widgets.onReady;
                        }
                        else {
                            var WidgetClass = Widget._init,
                                proto;

                            WidgetClass[PROTOTYPE] = proto = originalWidgetClass[PROTOTYPE];
                            
                            proto.init = originalWidgetClass;
                            
                            if (!proto._isWidget)
                            {
                                raptor.extend(proto, Widget, false /* don't override */);
                            }
                            
                            widget = new WidgetClass(events);
                            
                            if (!proto.notify) {
                                proto.notify = _notify;
                                proto.on = proto.subscribe;
                            }
                            
                            widget.registerMessages(['beforeDestroy', 'destroy'], false);
                            
                            var allowedEvents = proto[EVENTS] || originalWidgetClass[EVENTS];
    
                            if (allowedEvents) {
                                widget.registerMessages(allowedEvents, false);
                            }
                            
                            widget._id = id;
                            widget._assignedId = assignedId;
                            widget._parentWidget = parentWidget;
                            
                            widgetsById[id] = widget;
                            
                            if (assignedId && scope) {
                                widgetsById[scope]._doc.addWidget(widget, assignedId);
                            }
                            
                            widget._doc = new Document(widget);
                        }
                        
                        
                        if (children && children.length) {
                            _initWidgets(children, widget);
                        }

                        if (widget.initBeforeOnDomReady === true) {
                            _initWidget(widget, config, type);
                        }
                        else {
                            _initWidgetOnReady(widget, config, type);
                        }
                    }

                };
                
            _initWidgets(widgetDefs);
        },
        
        /**
         * Gets a widget by widget ID
         * @param {string} id The ID of the widget
         * @returns {object} The widget instance
         */
        get: function(id) {
            return widgetsById[id];
        },
        
        _nextWidgetId: function() {
            return 'c' + nextWidgetId++;
        }
    };
});

raptor.global.$rwidgets = function() {
    "use strict";
    
    var widgets = raptor.require('widgets');
    widgets._initAll(raptor.arrayFromArguments(arguments));
};
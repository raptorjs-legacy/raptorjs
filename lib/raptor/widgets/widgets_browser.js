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
define.extend('raptor/widgets', function(require, widgets) {
    "use strict";
    
    var logger = require('raptor/logging').logger('raptor/widgets'),
        widgetsById = {},
        raptor = require('raptor'),
        Widget = require('raptor/widgets/Widget'),
        _convertEvents = function(events) {
            var convertedEvents = {};
            raptor.forEach(events, function(event) {
                convertedEvents[event[0]] = {
                    target: event[1],
                    props: event[2]
                };
            }, this);
            return convertedEvents;
        };
    
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
        _remove: function(widget, id) {
            var docWidget = this.widget;
            
            var existing = this.widgetsById[id];
            if (existing) {
                this.widgetsById[id] = existing.filter(function(cur) {
                    return cur !== widget;
                });
            }

            if (docWidget[id] === widget) {
                delete docWidget[id];
            }
        },

        /**
         * 
         * @param widget
         * @param id
         */
        addWidget: function(widget, id) {
            var existing = this.widgetsById[id],
                docWidget = this.widget;
            
            if (!existing) {
                this.widgetsById[id] = [widget];
            }
            else {
                existing.push(widget);
            }

            docWidget[id] = widget;
        },
        
        /**
         * 
         * @param id
         * @returns
         */
        getWidget: function(id) {
            var matching = this.widgetsById[id];
            if (!matching || matching.length === 0) {
                return undefined;
            }
            if (matching.length === 1) {
                return matching[0];
            }
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

    /**
     * Creates and registers a widget without initializing it.
     * 
     * @param   {String} type       The class type for the module (e.g. "some/namespace/MyWidget")
     * @param   {String} id         The ID for the widget. This should typically be the ID of the widget's root DOM element
     * @param   {String} assignedId The assigned ID by the widget that this widget is scoped within
     * @param   {Object} config     A user-provided configuration object for the widget being initialized
     * @param   {String} scope      The widget ID of the widget that the new widget is scoped within
     * @param   {Object} events     A mapping of widget events to pubsub messages/topics
     * @return  {Function} A function that can be used to complete the initialization of the widget
     * @private
     */
    var _registerWidget = function(type, id, assignedId, config, scope, events, parent) {
        if (!require.exists(type)) {
            throw raptor.createError(new Error('Unable to initialize widget of type "' + type + '". The class for the widget was not found.'));
        }

        var widget, // This will be the newly created widget instance of the provided type
            OriginalWidgetClass = require(type); // The user-provided constructor function

        logger.debug('Creating widget of type "' + type + '" (' + id + ')');
        
        if (OriginalWidgetClass.initWidget) { //Check if the Widget has an "initWidget" function that will do the initialization
            /*
             * Update the config with the information that 
             * the user "initWidget" function by need:
             */
            config.elId = id;
            config.events = events;

            widget = OriginalWidgetClass; //Use the provided object as the widget

            if (!OriginalWidgetClass.onReady) { //Add an onReady function that can be used to initialize the widget onReady
                OriginalWidgetClass.onReady = widgets.onReady;    
            }
        }
        else {
            /*
             * We have to create a temporary constructor function because we want
             * to delay the invocation of the user's constructor function until
             * we have had a chance to add all of the required special 
             * properties (_id, _assignedId, _events, etc.)
             */ 
            var WidgetClass = function() {}, 
                proto; //This will be a reference to the original prorotype

            WidgetClass.prototype = proto = OriginalWidgetClass.prototype;
            
            widget = new WidgetClass();
            
            Widget.makeWidget(widget, proto); //Will apply Widget mixins if the widget is not already a widget
            
            
            
            // Register events that allow widgets support:
            widget.registerMessages(['beforeDestroy', 'destroy'], false);
            
            // Check if the user's widget has an additional events defined
            var allowedEvents = proto.events || OriginalWidgetClass.events;

            if (allowedEvents) {
                widget.registerMessages(allowedEvents, false);
            }
            
            // Add required specified properties required by the Widget mixin methods
            widget._id = id;
            

            if (!OriginalWidgetClass.getName) {
                OriginalWidgetClass.getName = function() {
                    return type;
                };    
            }
            
            if (!widget.constructor) {
                proto.constructor = OriginalWidgetClass;
            }

            if (Widget.legacy) {
                widget._parentWidget = parent;
            }
            
            if (events) {
                widget._events = _convertEvents(events);
            }
            

            widgetsById[id] = widget; // Register the widget in a global lookup
            
            if (assignedId && scope) { // If the widget is scoped within another widget then register the widget in the scope
                widget._assignedId = assignedId;
                widget._scope = scope;

                var parentWidget = widgetsById[scope];
                if (!parentWidget) {
                    throw raptor.createError(new Error('Parent scope not found: ' + scope));
                }
                widgetsById[scope]._doc.addWidget(widget, assignedId);
            }
            
            widget._doc = new Document(widget); //This widget might have other widgets scoped within it 
        }

        return {
            widget : widget,
            init : function() {
                var _doInitWidget = function() {
                    if (widget.initWidget) {
                        widget.initWidget(config);
                    }
                    else {
                        OriginalWidgetClass.call(widget, config);
                    }
                };
    
                if (widget.initBeforeOnDomReady === true) {
                    _doInitWidget();
                }
                else {
                    widget.onReady(_doInitWidget);
                }
            }
        };
    };

    return {

        initWidget: function(widgetDef) {
            var result  = _registerWidget(
                widgetDef.type, 
                widgetDef.id, 
                widgetDef.assignedId, 
                widgetDef.config, 
                widgetDef.scope ? widgetDef.scope.id : null, 
                widgetDef.events);

            widgetDef.widget = result.widget;
            
            if (widgetDef.children.length) {
                widgetDef.children.forEach(this.initWidget, this);
            }

            // Complete the initialization of this widget after all of the children have been initialized
            result.init();
        },

        /**
         * 
         * @param {...widgets} widgets An array of widget definitions
         * @returns {void}
         */
        _serverInit: function(widgetDefs) {
            var _initWidgets = function(widgetDefs, parent) {
                    if (!widgetDefs) {
                        return;
                    }

                    var i=0,
                        len = widgetDefs.length;
                    
                    for (; i<len; i++) {
                        
                        // Each widget def serialized from the server is encoded into a minimal
                        // array object that we need to decipher...
                        var widgetDef = widgetDefs[i], 
                            type = widgetDef[0],
                            id = widgetDef[1],
                            config = widgetDef[2] || {},
                            scope = widgetDef[3],
                            assignedId = widgetDef[4],
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

                        
                        // First register the widget and get back a function to complete the initialization.
                        // The widget should not be initialized until all of its children have first been
                        // initialized.
                        var result = _registerWidget(type, id, assignedId, config, scope, events, parent);


                        // Initialize all of the children
                        if (children && children.length) {
                            _initWidgets(children, result.widget);
                        }

                        // Now finish the initialization of the current widget now that the children have been initialized
                        result.init();
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

        _remove: function(id) {
            delete widgetsById[id];
        }
    };
});

$rwidgets = function() {
    /*jshint strict:false */
    require('raptor/widgets')._serverInit(require('raptor').arrayFromArguments(arguments));
};

require('raptor/pubsub').subscribe({
    'dom/beforeRemove': function(eventArgs) {
        /*jshint strict:false */

        var el = eventArgs.el;
        var widget = require('raptor/widgets').get(el.id);
        if (widget) {
            widget.destroy({
                removeNode: false,
                recursive: true
            });
        }
    },

    'raptor/component-renderer/renderedToDOM': function(eventArgs) {
        /*jshint strict:false */
        
        var widgets = require('raptor/widgets');

        var context = eventArgs.context,
            widgetsContext = widgets.getWidgetsContext(context);

        widgetsContext.initWidgets();
    }
});
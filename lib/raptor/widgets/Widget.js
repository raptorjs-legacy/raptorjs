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
 * Mixins applied to the prototypes of all widget instances
 * @mixin
 * 
 * @borrows raptor/listeners/Observable#publish as #publish
 * @borrows raptor/listeners/Observable#subscribe as #subscribe
 */
define(
    'raptor/widgets/Widget',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var forEach = raptor.forEach,
            listeners = require('raptor/listeners'),
            _destroy = function(widget, removeNode, recursive) {
                var message = {
                        widget: widget
                    },
                    rootEl;
                
                widget.publish('beforeDestroy', message);
                
                //Have the widget unsubscribe from any messages that is currently subscribed to
                listeners.unsubscribeFromAll(widget);
                
                widget.__destroyed = true;
                
                if (removeNode) {
                    //Remove the widget's DOM nodes from the DOM tree if the root element is known
                    rootEl = widget.getRootEl();
                    if (rootEl) {
                        rootEl.parentNode.removeChild(rootEl);
                    }
                }
                
                if (recursive) {
                    forEach(widget.getChildren(), function(childWidget) {
                        _destroy(childWidget, removeNode && !rootEl, true);
                    });
                }
                
                widget.publish('destroy', message);
            };
        
        return {
            
            /**
             * 
             */
            _isWidget: true,
            
            /**
             * 
             * @returns
             */
            _init: function(events) {
                this._children = [];
                this._childrenById = {};
                this._events = events;
            },
            
            /**
             * 
             * @returns
             */
            getObservable: function() {
                return this._observable || (this._observable = listeners.createObservable());
            },
            
            /**
             * 
             * @param allowedMessages
             * @param createFuncs
             * @returns
             */
            registerMessages: function(allowedMessages, createFuncs) {
                this.getObservable().registerMessages.apply(this, arguments);
            },
            
            /**
             * 
             * @param message
             * @param props
             * @returns
             */
            publish: function(message, props) {
                var ob = this.getObservable();
                ob.publish.apply(ob, arguments);
                var pubsubEvent;
                
                if (this._events && (pubsubEvent = this._events[message])) {
                    
                    if (pubsubEvent.props) {
                        props = raptor.extend(props || {}, pubsubEvent.props); 
                    }
                    require('raptor/pubsub').publish(pubsubEvent.target, props);
                    
                }
            },
            
            /**
             * 
             * @param message
             * @param callback
             * @param thisObj
             * @returns
             */
            subscribe: function(message, callback, thisObj) {
                var ob = this.getObservable();
                return ob.subscribe.apply(ob, arguments);
            },
            
            /**
             * Returns the DOM element ID corresponding to the provided
             * widget element ID. 
             * 
             * @param {string} widgetElId The widget element ID.
             * @returns {string} The DOM element ID corresponding tothe provided widget element ID
             */
            getElId: function(widgetElId) {
                return widgetElId ? this._id + "-" + widgetElId : this._id;
            },
            
            /**
             * Returns the root element ID for the widget. 
             *
             * @returns
             */
            getRootElId: function() {
                return this.getElId();
            },
    
            /**
             * Returns a raw DOM element for the given widget element ID. If no
             * widget element ID is provided then
             * @param widgetElId
             * @returns {DOMElement} The DOM element
             */
            getEl: function(widgetElId) {
                return document.getElementById(this.getElId(widgetElId));
            },
            
            /**
             * Returns the root DOM element for a widget (or null if not found).
             * 
             * @returns {DOMElement} The root DOM element for the widget
             */
            getRootEl: function() {
                return this.getEl();
            },
    
            /**
             * 
             * Returns a single nested widget instance with the specified ID. 
             * 
             * NOTE: If multiple nested widgets exist with the specified ID then
             *       an exception will be thrown.
             *       
             * @param nestedWidgetId
             * @returns {object} The child instance widget or null if one is not found.
             */
            getWidget: function(nestedWidgetId) {
                var doc = this._doc;
                return doc ? doc.getWidget(nestedWidgetId) : null;
            },
            
            /**
             * Returns an array of nested widgets with the specified widget ID.
             * @param nestedWidgetId
             * @returns {array} An array of nested widgets (or an empty array if none are found)
             */
            getWidgets: function(nestedWidgetId) {
                var doc = this._doc;
                return doc ? doc.getWidgets(nestedWidgetId) : null;
            },
            
            /**
             * 
             * @deprecated Use {@Link raptor/widgets/Widget#getWidget} instead
             */
            getChild: function(nestedWidgetId) {
                return this.getWidget(nestedWidgetId);
            },
            
            /**
             * @deprecated Use {@Link raptor/widgets/Widget#getWidgets} instead
             */
            getChildren: function(nestedWidgetId) {
                return this.getWidget(nestedWidgetId);
            },
            
            /**
             * Returns the document associated with this widget. The widget document will contain
             * all widgets with an assigned ID declared in the same template.
             * 
             * @returns 
             */
            getDoc: function() {
                return this._doc;
            },
            
            /**
             * 
             * Returns the parent widget instance for this widget.
             * 
             * @returns {raptor/widgets/Widget} The parent widget for this widget or null if this widget does not have a parent.
             *
             * @deprecated Do not use this method
             */
            getParent: function() {
                return this._parentWidget;
            },
            
            /**
             * @deprecated Use getWidget instead
             * 
             * @param nestedWidgetId
             * @returns
             */
            getChildWidget: function(nestedWidgetId) {
                return this.getChild(nestedWidgetId);
            },
            
            /**
             * @deprecated Use getWidgets instead
             * @param childWidgetsId
             * @returns
             */
            getChildWidgets: function(childWidgetsId) {
                return this.getChildren.apply(this, arguments);
            },
            
            /**
             * @deprecated Use getParent instead
             * @returns
             */
            getParentWidget: function() {
                return this._parentWidget;
            },
            
            /**
             * Destroys a widget.
             * 
             * If the root element is specified for the widget then the widget will
             * be removed from the DOM. In addition, all of the descendent widgets
             * will be destroyed as well.
             * 
             * The "beforeDestroy" message will be published by the widget before
             * the widget is actually destroyed.
             * 
             * The "destroy" message will be published after the widget
             * has been destroyed.
             * 
             * NOTE: The widget will automatically be unsubscribed from all messages
             *       that it has subscribed to.
             * 
             */
            destroy: function(options) {
                
                _destroy(this, true, true);
            },
            
            /**
             * Returns true if this widget has been destroyed.
             * 
             * A widget is considered destroyed if the "destroy" method
             * was invoked on the widget or one of its ancestor widgets.
             * 
             * @returns {boolean} True if this widget has been destroyed. False, otherwise.
             */
            isDestroyed: function() {
                return this.__destroyed;
            }
            
            /**
             * Sends a notification to subscribers using the provided name and arguments.
             * 
             * This method is slightly different from the {@Link raptor/widgets/Widget#publish}
             * in that the variable arguments will be passed directly to the subscribers.
             * <b>This method will be removed in the future.</b> 
             * 
             * @function
             * @name notify
             * @param name {String} The message name
             * @param ...args {Object} A variable set of arguments
             * @memberOf raptor/widgets/Widget
             * 
             * @deprecated Use {@Link raptor/widgets/Widget#publish} instead
             */
            
            /**
             * Subscribes to one or more events. 
             * 
             * This method has been deprecated and is a synonym for the {@Link raptor/widgets/Widget#subscribe} method
             * to maintain backwards compatibility.
             * <b>This method will be removed in the future.</b>
             * 
             * @function
             * @name on
             * @memberOf raptor/widgets/Widget
             * @deprecated Use {@Link raptor/widgets/Widget#subscribe} instead
             */
            
            
        };
    });
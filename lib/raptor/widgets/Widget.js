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
            dom = require('raptor/dom'),
            _destroy = function(widget, removeNode, recursive) {
                var message = {
                        widget: widget
                    },
                    rootEl = widget.getRootEl(),
                    widgets = require('raptor/widgets'),
                    assignedId = widget._assignedId,
                    doc;
                
                widget.publish('beforeDestroy', message);
                
                //Have the widget unsubscribe from any messages that is currently subscribed to
                listeners.unsubscribeFromAll(widget);
                
                widget.__destroyed = true;
                
                
                if (rootEl) {
                    if (recursive) {
                        var walkDOM = function(el) {
                            dom.forEachChildEl(el, function(childEl) {
                                if (childEl.id) {
                                    var descendentWidget = widgets.get(childEl.id);
                                    if (descendentWidget) {
                                        _destroy(descendentWidget, false, false);
                                    }
                                }
                                
                                walkDOM(childEl);
                            });
                        };

                        walkDOM(rootEl);
                    }
                    
                    if (removeNode) {
                        //Remove the widget's DOM nodes from the DOM tree if the root element is known
                        rootEl.parentNode.removeChild(rootEl);
                    }
                }
                
                widgets._remove(widget._id);

                if (assignedId) {
                    var scopeWidget = widgets.get(widget._scope);
                    if (scopeWidget) {
                        scopeWidget.getDoc()._remove(widget, assignedId);
                    }
                }

                widget.publish('destroy', message);
            },
            widgetProto;
        
        var Widget = function() {

        };

        Widget.makeWidget = function(widget, proto) {
            if (!widget._isWidget) {
                for (var k in widgetProto) {
                    if (!proto.hasOwnProperty(k)) {
                        proto[k] = widgetProto[k];
                    }
                }
            }
        };

        Widget.prototype = widgetProto = {
            /**
             * 
             */
            _isWidget: true,
            
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
             * Returns the document associated with this widget. The widget document will contain
             * all widgets with an assigned ID declared in the same template.
             * 
             * @returns 
             */
            getDoc: function() {
                return this._doc;
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
                options = options || {};
                _destroy(this, options.removeNode !== false, options.recursive !== false);
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
            },
            
            /**
             * Re-renders a widget by replacing the widget's existing root element with
             * the newly rendered HTML.
             *
             * <p>The widget instance is required to have a "renderer" property that defines
             * the renderer to use, or, if the name ends in "Widget" then the renderer
             * will be assumed to be of the name with "Widget" replaced with "Renderer" 
             * (e.g. "ui/buttons/Button/ButtonWidget" --> "ui/buttons/Button/ButtonRenderer")
             * 
             * @param  {Object} data The data to use as input to the renderer
             * @param  {raptor/render-context/Context} The render context (optional)
             * 
             * @return {raptor/component-renderer/RenderResult}   Returns the resulting of re-rendering the component
             */
            rerender: function(data, context) {
                var renderer = this.renderer,
                    type = this.constructor.getName(),
                    componentRenderer = require('raptor/component-renderer'),
                    rootEl = this.getRootEl();

                if (!rootEl) {
                    throw raptor.createError(new Error("Root element missing for widget of type " + type));
                }

                if (!renderer) {
                    
                    if (this.constructor.render) {
                        renderer = this.constructor;
                    }
                    else {
                        if (type.endsWith("Widget")) {
                            renderer = require.find(type.slice(0, -6) + "Renderer");
                        }
                    }
                }

                if (!renderer) {
                    throw raptor.createError(new Error("Renderer not found for widget " + type));
                }

                return componentRenderer.render(renderer, data, context).replace(rootEl);
            }


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
             */
        };

        widgetProto.on = widgetProto.subscribe;
        widgetProto.notify = widgetProto.publish;

        return Widget;
    });
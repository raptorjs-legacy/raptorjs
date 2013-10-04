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
        
        var listeners = require('raptor/listeners'),
            dom = require('raptor/dom'),
            _destroy = function(widget, removeNode, recursive) {
                var message = {
                        widget: widget
                    },
                    rootEl = widget.getEl(),
                    widgets = require('raptor/widgets'),
                    assignedId = widget._assignedId;
                
                widget.publish('beforeDestroy', message);
                
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
                    
                    if (removeNode && rootEl.parentNode) {
                        //Remove the widget's DOM nodes from the DOM tree if the root element is known
                        rootEl.parentNode.removeChild(rootEl);
                    }
                }
                
                widgets._remove(widget._id);

                if (assignedId) {
                    var scopeWidget = widgets.get(widget._scope);
                    if (scopeWidget) {
                        scopeWidget.widgets._remove(widget, assignedId);
                    }
                }

                widget.publish('destroy', message);

                // Have the widget unsubscribe from any messages that is currently subscribed to
                // Unsubscribe all messages after publishing "destroy" otherwise the widget might not get that event
                listeners.unsubscribeFromAll(widget);
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
             * Returns a raw DOM element for the given widget element ID. If no
             * widget element ID is provided then the root DOM node that the widget is bound to is returned.
             * @param widgetElId
             * @returns {DOMElement} The DOM element
             */
            getEl: function(widgetElId) {
                if (arguments.length === 1) {
                    return document.getElementById(this.getElId(widgetElId));
                } else {
                    return this.el || document.getElementById(this.getElId());
                }
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
                return this.widgets.getWidget(nestedWidgetId);
            },
            
            /**
             * Returns an array of nested widgets with the specified widget ID.
             * @param nestedWidgetId
             * @returns {array} An array of nested widgets (or an empty array if none are found)
             */
            getWidgets: function(nestedWidgetId) {
                return this.widgets.getWidgets(nestedWidgetId);
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
             * This function will return the root element but unlike "getEl()" function, it will throw an error if there
             * is no root element.
             */
            _getRootEl : function() {
                var rootEl = this.getEl();
                if (!rootEl) {
                    throw raptor.createError(new Error("Root element missing for widget of type " + this.constructor.getName()));
                }
                return rootEl;
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
             * @return {raptor/renderer/RenderResult}   Returns the resulting of re-rendering the component
             */
            rerender: function(data, context) {
                var renderer = this.renderer,
                    type = this.constructor.getName(),
                    componentRenderer = require('raptor/renderer'),
                    rootEl = this._getRootEl();

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
            },

            /**
             * This method removes the widget's root element from the DOM and saves a reference to
             * it so that the widget can be re-attached to the DOM later.
             *
             * After detaching widget from DOM, use one of the following methods to re-attach:
             * - appendTo
             * - replace
             * - replaceChildrenOf
             * - insertBefore
             * - insertAfter
             * - prependTo
             *
             * @throws Error if widget does not have a root element
             */
            detach: function() {
                dom.detach(this._getRootEl());
            },

            /**
             * Appends the widget's root element as a child of the target element.
             *
             * @param  {DOMElement|String} targetEl The target element
             * @return {void}
             */
            appendTo: function(targetEl) {
                dom.appendTo(this._getRootEl(), targetEl);
            },

            /**
             * Replaces the target element with the widget's root element.
             *
             * @param  {DOMElement|String} targetEl The target element
             * @return {void}
             */
            replace: function(targetEl) {
                dom.replace(this._getRootEl(), targetEl);
            },
            
            /**
             * Replaces the children of target element with the widget's root element.
             *
             * @param  {DOMElement|String} targetEl The target element
             * @return {void}
             */
            replaceChildrenOf: function(targetEl) {
                dom.replaceChildrenOf(this._getRootEl(), targetEl);
            },

            /**
             * Inserts the widget's root element before the target element (as a sibling).
             *
             * @param  {DOMElement|String} targetEl The target element
             * @return {void}
             */
            insertBefore: function(targetEl) {
                dom.insertBefore(this._getRootEl(), targetEl);
            },

            /**
             * Inserts the widget's root element after the target element (as a sibling).
             *
             * @param  {DOMElement|String} targetEl The target element
             * @return {void}
             */
            insertAfter: function(targetEl) {
                dom.insertAfter(this._getRootEl(), targetEl);
            },


            /**
             * Prepends the widget's root element as a child of the target element.
             *
             * @param  {DOMElement|String} targetEl The target element
             * @return {void}
             */
            prependTo: function(targetEl) {
                dom.prependTo(this._getRootEl(), targetEl);
            }

            /**
             * Subscribes to one or more events.
             *
             * This method is a synonym for the {@Link raptor/widgets/Widget.subscribe} method
             * to maintain backwards compatibility.
             * <b>This method will be removed in the future.</b>
             *
             * @function
             * @name on
             * @memberOf raptor/widgets/Widget
             */
        };

        widgetProto.on = widgetProto.subscribe;

        return Widget;
    });
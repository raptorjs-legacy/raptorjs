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
define('raptor/widgets/Widget', ['raptor'], function (raptor, require) {
    'use strict';
    var listeners = require('raptor/listeners'), dom = require('raptor/dom'), _destroy = function (widget, removeNode, recursive) {
            var message = { widget: widget }, rootEl = widget.getEl(), widgets = require('raptor/widgets'), assignedId = widget._assignedId;
            widget.publish('beforeDestroy', message);
            widget.__destroyed = true;
            if (rootEl) {
                if (recursive) {
                    var walkDOM = function (el) {
                        dom.forEachChildEl(el, function (childEl) {
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
        }, widgetProto;
    var Widget = function () {
    };
    Widget.makeWidget = function (widget, proto) {
        if (!widget._isWidget) {
            for (var k in widgetProto) {
                if (!proto.hasOwnProperty(k)) {
                    proto[k] = widgetProto[k];
                }
            }
        }
    };
    Widget.prototype = widgetProto = {
        _isWidget: true,
        getObservable: function () {
            return this._observable || (this._observable = listeners.createObservable());
        },
        registerMessages: function (allowedMessages, createFuncs) {
            this.getObservable().registerMessages.apply(this, arguments);
        },
        publish: function (message, props) {
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
        subscribe: function (message, callback, thisObj) {
            var ob = this.getObservable();
            return ob.subscribe.apply(ob, arguments);
        },
        getElId: function (widgetElId) {
            return widgetElId ? this._id + '-' + widgetElId : this._id;
        },
        getEl: function (widgetElId) {
            if (arguments.length === 1) {
                return document.getElementById(this.getElId(widgetElId));
            } else {
                return this.el || document.getElementById(this.getElId());
            }
        },
        getWidget: function (nestedWidgetId) {
            return this.widgets.getWidget(nestedWidgetId);
        },
        getWidgets: function (nestedWidgetId) {
            return this.widgets.getWidgets(nestedWidgetId);
        },
        destroy: function (options) {
            options = options || {};
            _destroy(this, options.removeNode !== false, options.recursive !== false);
        },
        isDestroyed: function () {
            return this.__destroyed;
        },
        _getRootEl: function () {
            var rootEl = this.getEl();
            if (!rootEl) {
                throw raptor.createError(new Error('Root element missing for widget of type ' + this.constructor.getName()));
            }
            return rootEl;
        },
        rerender: function (data, context) {
            var renderer = this.renderer, type = this.constructor.getName(), componentRenderer = require('raptor/renderer'), rootEl = this._getRootEl();
            if (!renderer) {
                if (this.constructor.render) {
                    renderer = this.constructor;
                } else {
                    if (type.endsWith('Widget')) {
                        renderer = require.find(type.slice(0, -6) + 'Renderer');
                    }
                }
            }
            if (!renderer) {
                throw raptor.createError(new Error('Renderer not found for widget ' + type));
            }
            return componentRenderer.render(renderer, data, context).replace(rootEl);
        },
        detach: function () {
            dom.detach(this._getRootEl());
        },
        appendTo: function (targetEl) {
            dom.appendTo(this._getRootEl(), targetEl);
        },
        replace: function (targetEl) {
            dom.replace(this._getRootEl(), targetEl);
        },
        replaceChildrenOf: function (targetEl) {
            dom.replaceChildrenOf(this._getRootEl(), targetEl);
        },
        insertBefore: function (targetEl) {
            dom.insertBefore(this._getRootEl(), targetEl);
        },
        insertAfter: function (targetEl) {
            dom.insertAfter(this._getRootEl(), targetEl);
        },
        prependTo: function (targetEl) {
            dom.prependTo(this._getRootEl(), targetEl);
        }    /**
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
    widgetProto.elId = widgetProto.getElId;
    return Widget;
});
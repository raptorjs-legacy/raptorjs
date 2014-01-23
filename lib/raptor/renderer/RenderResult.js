define('raptor/renderer/RenderResult', function (require) {
    'use strict';
    var dom = require('raptor/dom');
    var RenderResult = function (html, context) {
        this.html = html;
        this.context = context;
        this._node = undefined;
    };
    RenderResult.prototype = {
        getWidget: function () {
            if (!this.widgetDefs) {
                throw new Error('Cannot call getWidget() until after HTML fragment is added to DOM.');
            }
            return this.widgetDefs.length ? this.widgetDefs[0].widget : undefined;
        },
        getWidgets: function (selector) {
            if (!this.widgetDefs) {
                throw new Error('Cannot call getWidgets() until after HTML fragment is added to DOM.');
            }
            var widgets, i;
            if (selector) {
                // use the selector to find the widgets that the caller wants
                widgets = [];
                for (i = 0; i < this.widgetDefs.length; i++) {
                    var widget = this.widgetDefs[i].widget;
                    if (selector(widget)) {
                        widgets.push(widget);
                    }
                }
            } else {
                // return all widgets
                widgets = new Array(this.widgetDefs.length);
                for (i = 0; i < this.widgetDefs.length; i++) {
                    widgets[i] = this.widgetDefs[i].widget;
                }
            }
            return widgets;
        },
        _afterInsert: function () {
            var widgets = require.find('raptor/widgets');
            if (widgets) {
                var widgetsContext = widgets.getWidgetsContext(this.context);
                this.widgetDefs = widgetsContext.widgets;
            }
            var pubsub = require.find('raptor/pubsub');
            if (pubsub) {
                pubsub.publish('raptor/renderer/renderedToDOM', {
                    node: this.getNode(),
                    context: this.context
                });    // NOTE: This will trigger widgets to be initialized if there were any
            }
            return this;
        },
        appendTo: function (referenceEl) {
            dom.appendTo(this.getNode(), referenceEl);
            return this._afterInsert();
        },
        replace: function (referenceEl) {
            dom.replace(this.getNode(), referenceEl);
            return this._afterInsert();
        },
        replaceChildrenOf: function (referenceEl) {
            dom.replaceChildrenOf(this.getNode(), referenceEl);
            return this._afterInsert();
        },
        insertBefore: function (referenceEl) {
            dom.insertBefore(this.getNode(), referenceEl);
            return this._afterInsert();
        },
        insertAfter: function (referenceEl) {
            dom.insertAfter(this.getNode(), referenceEl);
            return this._afterInsert();
        },
        prependTo: function (referenceEl) {
            dom.prependTo(this.getNode(), referenceEl);
            return this._afterInsert();
        },
        getNode: function () {
            var node = this._node, curEl, newBodyEl;
            if (node === undefined) {
                if (this.html) {
                    newBodyEl = document.createElement('body');
                    newBodyEl.innerHTML = this.html;
                    if (newBodyEl.childNodes.length == 1) {
                        // If the rendered component resulted in a single node then just use that node
                        node = newBodyEl.childNodes[0];
                    } else {
                        // Otherwise, wrap the nodes in a document fragment node
                        node = document.createDocumentFragment();
                        while (curEl = newBodyEl.firstChild) {
                            node.appendChild(curEl);
                        }
                    }
                } else {
                    // empty HTML so use empty document fragment (so that we're returning a valid DOM node)
                    node = document.createDocumentFragment();
                }
                this._node = node;
            }
            return node;
        }
    };
    return RenderResult;
});
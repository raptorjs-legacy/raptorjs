define('raptor/renderer/RenderResult', function(require) {
    "use strict";

    var dom = require('raptor/dom');

    var RenderResult = function(html, context) {
        this.html = html;
        this.context = context;
        this._node = undefined;
    };

    RenderResult.prototype = {
            
        getWidget : function() {
            if (!this.widgetDefs) {
                throw new Error('Cannot call getWidget() until after HTML fragment is added to DOM.');
            }
            return this.widgetDefs.length ? this.widgetDefs[0].widget : undefined;
        },

        /**
         * This method used to retrieve all or some of the widgets that were instantiated as a result of rendering.
         *
         * @param {Function} selector an optional function that should accept a widget argument
         *      and return true if the widget should be selected
         * @return {raptor/widgets/Widget[]} the array of widgets that matched the selector or
         *      all widgets if no selector was given
         */
        getWidgets: function(selector) {

            if (!this.widgetDefs) {
                throw new Error('Cannot call getWidgets() until after HTML fragment is added to DOM.');
            }
            
            var widgets,
                i;

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
        
        /**
         * Invoked after the rendered document fragment is inserted into the DOM.
         *
         * @return  {void}
         * @private
         */
        _afterInsert: function() {
            
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
                }); // NOTE: This will trigger widgets to be initialized if there were any
            }
            
            return this;
        },

        /**
         * Appends the rendered document fragment as a child of the reference element.
         *
         * @param  {DOMElement|String} referenceEl The reference element
         * @return {void}
         */
        appendTo: function(referenceEl) {
            dom.appendTo(this.getNode(), referenceEl);
            return this._afterInsert();
        },

        /**
         * Replaces the reference element with the rendered document fragment.
         *
         * @param  {DOMElement|String} referenceEl The reference element
         * @return {void}
         */
        replace: function(referenceEl) {
            dom.replace(this.getNode(), referenceEl);
            return this._afterInsert();
        },
        
        /**
         * Replaces the children of reference element with the rendered document fragment.
         *
         * @param  {DOMElement|String} referenceEl The reference element
         * @return {void}
         */
        replaceChildrenOf: function(referenceEl) {
            dom.replaceChildrenOf(this.getNode(), referenceEl);
            return this._afterInsert();
        },

        /**
         * Inserts the rendered document fragment before the reference element (as a sibling).
         *
         * @param  {DOMElement|String} referenceEl The reference element
         * @return {void}
         */
        insertBefore: function(referenceEl) {
            dom.insertBefore(this.getNode(), referenceEl);
            return this._afterInsert();
        },

        /**
         * Inserts the rendered document fragment after the reference element (as a sibling).
         *
         * @param  {DOMElement|String} referenceEl The reference element
         * @return {void}
         */
        insertAfter: function(referenceEl) {
            dom.insertAfter(this.getNode(), referenceEl);
            return this._afterInsert();
        },


        /**
         * Prepends the rendered document fragment as a child of the reference element.
         *
         * @param  {DOMElement|String} referenceEl The reference element
         * @return {void}
         */
        prependTo: function(referenceEl) {
            dom.prependTo(this.getNode(), referenceEl);
            return this._afterInsert();
        },

        /**
         * Returns the DOM node for the rendered HTML. If the rendered HTML resulted
         * in multiple top-level DOM nodes then the top-level DOM nodes are wrapped
         * in a single DocumentFragment node.
         *
         * @return {Node|DocumentFragment} The DOM node that can be used to insert the rendered HTML into the DOM.
         */
        getNode: function() {
            var node = this._node,
                curEl,
                newBodyEl;

            if (node === undefined) {
                if (this.html) {
                    newBodyEl = document.createElement('body');
                    newBodyEl.innerHTML = this.html;

                    if (newBodyEl.childNodes.length == 1) { // If the rendered component resulted in a single node then just use that node
                        node = newBodyEl.childNodes[0];
                    }
                    else { // Otherwise, wrap the nodes in a document fragment node
                        node = document.createDocumentFragment();

                        while((curEl=newBodyEl.firstChild)) {
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
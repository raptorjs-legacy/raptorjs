define('raptor/renderer/RenderResult', function(require) {
    "use strict";

    var getEl = function(el) {
        if (typeof el === 'string') {
            var elId = el;
            el = document.getElementById(elId);
            if (!el) {
                throw raptor.createError(new Error('Target element not found: "' + elId + '"'));
            }
        }
        return el;
    };

    var RenderResult = function(html, context) {
        this.html = html;
        this.context = context;
        this._node = null;
    };

    RenderResult.prototype = {
            
        getWidget : function() {
            if (!this.widgetDefs) {
                throw new Error('Cannot call getWidget() until after HTML fragment is added to DOM.');
            }
            return this.widgetDefs.length ? this.widgetDefs[0].widget : undefined;
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
        
        _beforeRemove: function(targetEl) {
            var pubsub = require.find('raptor/pubsub');
            if (pubsub) {
                pubsub.publish('dom/beforeRemove', { // NOTE: Give other modules a chance to gracefully cleanup after removing the old node
                    el: targetEl
                }); 
            }
        },

        /**
         * Appends the rendered document fragment as a child of the target element.
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        appendTo: function(targetEl) {
            getEl(targetEl).appendChild(this.getNode());
            return this._afterInsert();
        },

        /**
         * Replaces the target element with the rendered document fragment.
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        replace: function(targetEl) {
            targetEl = getEl(targetEl);

            this._beforeRemove(targetEl);
            targetEl.parentNode.replaceChild(this.getNode(), targetEl);
            return this._afterInsert();
        },
        
        /**
         * Replaces the children of target element with the rendered document fragment.
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        replaceChildrenOf: function(targetEl) {
            targetEl = getEl(targetEl);
            var pubsub = require.find('raptor/pubsub');
            if (pubsub) {
                require('raptor/dom').forEachChildEl(targetEl, function(childEl) {
                    this._beforeRemove(childEl); 
                }, this);
            }
            targetEl.innerHTML = "";
            targetEl.appendChild(this.getNode());
            return this._afterInsert();
        },

        /**
         * Inserts the rendered document fragment before the target element (as a sibling).
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        insertBefore: function(targetEl) {
            targetEl = getEl(targetEl);            
            targetEl.parentNode.insertBefore(this.getNode(), targetEl);
            return this._afterInsert();
        }, 

        /**
         * Inserts the rendered document fragment after the target element (as a sibling).
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        insertAfter: function(targetEl) {
            targetEl = getEl(targetEl);
            var nextSibling = targetEl.nextSibling,
                parentNode = targetEl.parentNode;

            if (nextSibling) {
                targetEl.parentNode.insertBefore(this.getNode(), nextSibling);
            }
            else {
                targetEl.parentNode.appendChild(this.getNode());
            }
            return this._afterInsert();
        }, 


        /**
         * Prepends the rendered document fragment as a child of the target element.
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        prependTo: function(targetEl) {
            targetEl = getEl(targetEl);
            targetEl.insertBefore(this.getNode(), targetEl.firstChild || null);
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

            if (!node) {
                
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
                

                this._node = node;
            }

            return node;
        }
    };

    return RenderResult;
});
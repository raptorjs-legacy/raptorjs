define('raptor/component-renderer/RenderResult', function(require) {
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
        this._fragment = null;
    };

    RenderResult.prototype = {
        /**
         * Invoked after the rendered document fragment is inserted into the DOM.
         * 
         * @return  {void}
         * @private
         */
        _afterInsert: function() {
            var pubsub = require('raptor/pubsub');
            if (pubsub) {
                pubsub.publish('raptor/component-renderer/renderedToDOM', { 
                    node: this.getDocumentFragment(),
                    context: this.context
                }); // NOTE: This will trigger widgets to be initialized if there were any    
            };
        },

        /**
         * Appends the rendered document fragment as a child of the target element.
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        appendChild: function(targetEl) {
            getEl(targetEl).appendChild(this.getDocumentFragment());
            this._afterInsert();
        },

        /**
         * Replaces the target element with the rendered document fragment.
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        replace: function(targetEl) {
            targetEl = getEl(targetEl);

            var pubsub = require.find('raptor/pubsub');
            if (pubsub) {
                pubsub.publish('dom/beforeRemove', { // NOTE: Give other modules a chance to gracefully cleanup after removing the old node
                    el: targetEl
                }); 
            }
            targetEl.parentNode.replaceChild(this.getDocumentFragment(), targetEl);
            this._afterInsert();
        }, 

        /**
         * Inserts the rendered document fragment before the target element (as a sibling).
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        insertBefore: function(targetEl) {
            targetEl = getEl(targetEl);            
            targetEl.parentNode.insertBefore(this.getDocumentFragment(), targetEl);
            this._afterInsert();
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
                targetEl.parentNode.insertBefore(this.getDocumentFragment(), nextSibling);
            }
            else {
                targetEl.parentNode.appendChild(this.getDocumentFragment());
            }
            this._afterInsert();
        }, 


        /**
         * Prepends the rendered document fragment as a child of the target element.
         * 
         * @param  {DOMElement|String} targetEl The target element
         * @return {void}
         */
        prependChild: function(targetEl) {
            targetEl = getEl(targetEl);
            targetEl.insertBefore(this.getDocumentFragment(), targetEl.firstChild || null);
            this._afterInsert();
        },

        /**
         * Returns the DocumentFragment DOM node for the render HTML.
         * 
         * @return {DocumentFragment} The DocumentFragment DOM node.
         */
        getDocumentFragment: function() {
            var docFragment = this._fragment,
                curEl,
                newBodyEl;

            if (!docFragment) {
                docFragment = document.createDocumentFragment();
                newBodyEl = document.createElement('body');

                newBodyEl.innerHTML = this.html;

                while(curEl=newBodyEl.firstChild) {
                    docFragment.appendChild(curEl);
                }

                this._fragment = docFragment;
            }

            return docFragment;
        }
    };

    return RenderResult;
});
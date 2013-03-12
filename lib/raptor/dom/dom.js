define('raptor/dom', function(require) {
    "use strict";

    var getNode = function(el) {
            if (typeof el === 'string') {
                var elId = el;
                el = document.getElementById(elId);
                if (!el) {
                    throw raptor.createError(new Error('Target element not found: "' + elId + '"'));
                }
            }
            return el;
        },
        _beforeRemove = function(referenceEl) {
            var pubsub = require.find('raptor/pubsub');
            if (pubsub) {
                pubsub.publish('dom/beforeRemove', { // NOTE: Give other modules a chance to gracefully cleanup after removing the old node
                    el: referenceEl
                }); 
            }
        };

    var dom = {
        forEachChildEl: function(node, callback, scope)
        {
            dom.forEachChild(node, callback, scope, 1);
        },

        /**
         * 
         */
        forEachChild: function(node, callback, scope, nodeType)
        {
            if (!node) {
                return;
            }

            var i=0, 
                childNodes = node.childNodes,
                len = childNodes.length;

            for (; i<len; i++)
            {
                var childNode = childNodes[i];
                if (childNode && (nodeType == null || nodeType == childNode.nodeType))
                {
                    callback.call(scope, childNode);
                }
            }
        },

        /**
         * This method removes a DOM node from the DOM tree by removing
         * it from its parent node.
         *
         * @param {Node|String} child The DOM node (or the ID of the DOM node) to detach from the DOM tree
         * @return {void}
         */
        detach: function(child) {
            child = getNode(child);
            child.parentNode.removeChild(child);
        },

        /**
         * Appends a DOM node as a child of another DOM node.
         *
         * @param  {Node|String} newChild The DOM node (or the ID of the DOM node) to append as a child
         * @param  {DOMElement|String} referenceParentEl The reference parent element
         * @return {void}
         */
        appendTo: function(newChild, referenceParentEl) {
            getNode(referenceParentEl).appendChild(getNode(newChild));
        },

        /**
         * Replaces a child DOM node with another DOM node 
         * 
         * @param  {Node|String} newChild The DOM node (or the ID of the DOM node) to use as a replacement
         * @param  {Node|String} replacedChild The reference child node that will be replaced by the new child
         * @return {void}
         */
        replace: function(newChild, replacedChild) {
            replacedChild = getNode(replacedChild);
            _beforeRemove(replacedChild);
            replacedChild.parentNode.replaceChild(getNode(newChild), replacedChild);
        },
        
        /**
         * Replaces the children of reference element with a new child
         *
         * @param  {Node|String} newChild The DOM node (or the ID of the DOM node) to use as a replacement
         * @param  {DOMElement|String} referenceParentEl The reference parent element
         * @return {void}
         */
        replaceChildrenOf: function(newChild, referenceParentEl) {
            referenceParentEl = getNode(referenceParentEl);
            dom.forEachChildEl(referenceParentEl, function(childEl) {
                _beforeRemove(childEl); 
            });

            referenceParentEl.innerHTML = "";
            referenceParentEl.appendChild(getNode(newChild));
        },

        /**
         * Inserts a DOM node before a reference node (as a sibling).
         * 
         * @param  {Node|String} newChild The DOM node (or the ID of the DOM node) to insert as a sibling
         * @param  {Node|String} referenceChild The reference child node
         * @return {void}
         */
        insertBefore: function(newChild, referenceChild) {
            referenceChild = getNode(referenceChild);    
            referenceChild.parentNode.insertBefore(getNode(newChild), referenceChild);
        }, 

        /**
         * Inserts a DOM node after a reference node (as a sibling).
         *
         * @param  {Node|String} newChild The DOM node (or the ID of the DOM node) to insert as a sibling
         * @param  {Node|String} referenceChild The reference child node
         * @return {void}
         */
        insertAfter: function(newChild, referenceChild) {
            referenceChild = getNode(referenceChild);
            newChild = getNode(newChild);

            var nextSibling = referenceChild.nextSibling,
                parentNode = referenceChild.parentNode;

            if (nextSibling) {
                parentNode.insertBefore(newChild, nextSibling);
            }
            else {
                parentNode.appendChild(newChild);
            }
        }, 


        /**
         * Prepends a DOM node as a child of another DOM node.
         *
         * @param  {Node|String} newChild The DOM node (or the ID of the DOM node) to append as a child
         * @param  {DOMElement|String} referenceParentEl The reference parent element
         * @return {void}
         */
        prependTo: function(newChild, referenceParentEl) {
            referenceParentEl = getNode(referenceParentEl);
            referenceParentEl.insertBefore(getNode(newChild), referenceParentEl.firstChild || null);
        }
    };

    return dom;
});
define('raptor/dom', function (require) {
    'use strict';
    var raptor = require('raptor');
    var getNode = function (el) {
            if (typeof el === 'string') {
                var elId = el;
                el = document.getElementById(elId);
                if (!el) {
                    throw raptor.createError(new Error('Target element not found: "' + elId + '"'));
                }
            }
            return el;
        }, _beforeRemove = function (referenceEl) {
            var pubsub = require.find('raptor/pubsub');
            if (pubsub) {
                pubsub.publish('dom/beforeRemove', { el: referenceEl });
            }
        };
    var dom = {
            forEachChildEl: function (node, callback, scope) {
                dom.forEachChild(node, callback, scope, 1);
            },
            forEachChild: function (node, callback, scope, nodeType) {
                if (!node) {
                    return;
                }
                var i = 0, childNodes = node.childNodes, len = childNodes.length;
                for (; i < len; i++) {
                    var childNode = childNodes[i];
                    if (childNode && (nodeType == null || nodeType == childNode.nodeType)) {
                        callback.call(scope, childNode);
                    }
                }
            },
            detach: function (child) {
                child = getNode(child);
                child.parentNode.removeChild(child);
            },
            appendTo: function (newChild, referenceParentEl) {
                getNode(referenceParentEl).appendChild(getNode(newChild));
            },
            remove: function (el) {
                el = getNode(el);
                _beforeRemove(el);
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            },
            removeChildren: function (parentEl) {
                parentEl = getNode(parentEl);
                dom.forEachChildEl(parentEl, function (childEl) {
                    _beforeRemove(childEl);
                });
                parentEl.innerHTML = '';
            },
            replace: function (newChild, replacedChild) {
                replacedChild = getNode(replacedChild);
                _beforeRemove(replacedChild);
                replacedChild.parentNode.replaceChild(getNode(newChild), replacedChild);
            },
            replaceChildrenOf: function (newChild, referenceParentEl) {
                referenceParentEl = getNode(referenceParentEl);
                dom.forEachChildEl(referenceParentEl, function (childEl) {
                    _beforeRemove(childEl);
                });
                referenceParentEl.innerHTML = '';
                referenceParentEl.appendChild(getNode(newChild));
            },
            insertBefore: function (newChild, referenceChild) {
                referenceChild = getNode(referenceChild);
                referenceChild.parentNode.insertBefore(getNode(newChild), referenceChild);
            },
            insertAfter: function (newChild, referenceChild) {
                referenceChild = getNode(referenceChild);
                newChild = getNode(newChild);
                var nextSibling = referenceChild.nextSibling, parentNode = referenceChild.parentNode;
                if (nextSibling) {
                    parentNode.insertBefore(newChild, nextSibling);
                } else {
                    parentNode.appendChild(newChild);
                }
            },
            prependTo: function (newChild, referenceParentEl) {
                referenceParentEl = getNode(referenceParentEl);
                referenceParentEl.insertBefore(getNode(newChild), referenceParentEl.firstChild || null);
            }
        };
    return dom;
});
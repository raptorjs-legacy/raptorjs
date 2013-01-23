define('raptor/dom', function(require) {
    "use strict";

    return {
        forEachChildEl: function(node, callback, scope)
        {
            this.forEachChild(node, callback, scope, 1);
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
        }
    };
});
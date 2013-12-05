define('raptor/cookies', function(require, exports, module) {
    "use strict";
    
    var CookieManager = require('raptor/cookies/CookieManager'),
        CONTEXT_KEY = 'raptor/cookies/CookieManager';

    return {
        getCookieManager: function(context, options) {
            if (!context) {
                throw new Error('"context" is a required argument');
            }

            var attributes = context.attributes;
            var cookieManager = attributes[CONTEXT_KEY];
            if (!cookieManager) {
                cookieManager = attributes[CONTEXT_KEY] = new CookieManager(attributes.raptorContext || context, options);
            }
            return cookieManager;
        }
    };
});
define('raptor/cookies', function(require, exports, module) {
    var CookieManager = require('raptor/cookies/CookieManager'),
        CONTEXT_KEY = 'raptor/cookies/CookieManager';

    return {
        getCookieManager: function(context, options) {
            if (!context) {
                throw new Error('"context" is a required argument');
            }

            var attributes = context.getAttributes();
            var cookieManager = attributes[CONTEXT_KEY];
            if (!cookieManager) {
                cookieManager = attributes[CONTEXT_KEY] = new CookieManager(context, options);
            }
            return cookieManager;
        }
    };
});
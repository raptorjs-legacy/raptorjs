define('raptor/cookies', function(require, exports, module) {
    var CookieManager = require('raptor/cookies/CookieManager'),
        CONTEXT_KEY = 'raptor/cookies/CookieManager';

    return {
        getCookieManager: function(context) {
            if (!context) {
                throw new Error('"context" is a required argument');
            }

            var attributes = context.getAttributes();
            var cookieManager = attributes[CONTEXT_KEY];
            if (!cookieManager) {
                cookieManager = attributes[CONTEXT_KEY] = new CookieManager(context);
            }
            return cookieManager;
        }
    };
});
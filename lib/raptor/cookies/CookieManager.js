define.Class('raptor/cookies/CookieManager', function(require, exports, module) {
    var Cookie = require('raptor/cookies/Cookie');
    var raptor = require('raptor');

    var CookieManager = function(context) {
        this._context = context;
        this._cookies = {};
        this._cookiesLoaded = false;
        this._saveEnabled = true;
    };

    CookieManager.prototype = {

        _loadCookies: function() {
            if (this.cookiesLoaded === false) {
                this._doLoadCookies();
                this.cookiesLoaded = true;
            }
        },

        addCookieInternal: function(name, value) {
            return (this._cookies[name] = new Cookie(name, value, options));
        },

        /**
         * This method can be used to return an existing cookie or to
         * return a new cookie
         */
        createCookie: function(name, value, options) {

            // Read in the initial cookies so that we can make sure the
            // newly created cookie overrides any existing cookie with the same
            // name that might already exist
            this._loadCookies();

            var cookie = this._cookies[name] = new Cookie(name, value, options);
            cookie.setModified(true);
            return cookie;
        },

        /**
         * @param name {String} The name of the cookie
         * @return {raptor/cookies/Cookie} Returns an existing with the specified name or null of the cookie does not exist.
         */
        getCookie: function(name, type) {
            this._loadInitialCookies();        
            var cookie = this._cookies[name];
            return cookie && !cookie.isDeleted() ? cookie : null;
        },

        getOrCreateCookie: function(name) {
            return this.getCookie(name) || this.createCookie(name);
        },

        getCookiesByName: function() {
            this._loadCookies();
            
            var cookies = {};
            
            raptor.forEachEntry(this._cookies, function(name, cookie) {
                if (!cookie.isDeleted()) {
                    cookies[name] = cookie;
                }
            });
            
            return cookies;
        },

        deleteCookie: function(name) {
            this._loadCookies();
            var cookie = this._cookies[name];
            if (cookie) {
                //Mark the cookie as deleted if it exists
                cookie.setDeleted(true);
            }
        },

        getCookieValue: function(name, defaultValue) {
            var cookie = this.getCookie(name);
            return cookie == null ? defaultValue : cookie.getValue();
        },
        
        setCookieValue: function(name, value) {
            var cookie = this.getOrCreateCookie(name);
            cookie.setValue(value);
        },

        commitCookies: function() {
            raptor.forEachEntry(this._cookies, function(name, cookie) {
                if (cookie.isModified()) {
                    var value,
                        maxAge,
                        domain = cookie.getDomain(),
                        path = cookie.getPath(),
                        secure = cookie.isSecure(),
                        httpOnly = cookie.isHttpOnly();

                    if (cookie.isDeleted()) {
                        value = '';
                        maxAge = 0;
                    }
                    else {
                        value = cookie.getValue();
                        maxAge = cookie.getMaxAge();
                    }

                    cookie.setModified(false);

                    this._commitCookie(
                        name, 
                        value, 
                        domain, 
                        path, 
                        maxAge, 
                        secure,
                        httpOnly);
                }
            }, this);
        }
    };

    return CookieManager;
});
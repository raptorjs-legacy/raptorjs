define.Class('raptor/cookies/CookieManager', function(require, exports, module) {
    'use strict';

    var Cookie = require('raptor/cookies/Cookie');
    var forEachEntry = require('raptor').forEachEntry;
    var beginningOfTime = new Date(0).toUTCString();

    var CookieManager = function(context, options) {
        this._context = context;
        this._options = options;
        this._cookies = {};
        this._cookiesLoaded = false;
        this._saveEnabled = true;
    };

    CookieManager.prototype = {
        _now: function() {
            return Date.now();
        },

        _expires: function(maxAge) {
            var expires;

            if (maxAge >= 0) {
                // Instead of using the MaxAge cookie property, we use
                // Expires since it is supported by all web browsers (including IE)
                if (maxAge === 0) {
                    expires = beginningOfTime;
                }
                else {
                    expires = new Date(this._now() + (maxAge * 1000)).toUTCString();
                }

                return expires;
            }

            return expires;
        },

        _loadCookies: function() {
            if (this._cookiesLoaded === false) {
                this._doLoadCookies();
                this._cookiesLoaded = true;
            }
        },

        _addCookieInternal: function(name, value) {
            return (this._cookies[name] = new Cookie(name, value));
        },

        /**
         * This method can be used to return an existing cookie or to
         * return a new cookie
         */
        createCookie: function(name, value) {

            // Read in the initial cookies so that we can make sure the
            // newly created cookie overrides any existing cookie with the same
            // name that might already exist
            this._loadCookies();

            var cookie = this._cookies[name] = new Cookie(name, value);
            cookie.setModified(true);
            return cookie;
        },

        /**
         * @param name {String} The name of the cookie
         * @return {raptor/cookies/Cookie} Returns an existing with the specified name or null of the cookie does not exist.
         */
        getCookie: function(name, type) {
            this._loadCookies();
            var cookie = this._cookies[name];
            return cookie && !cookie.isDeleted() ? cookie : null;
        },

        getOrCreateCookie: function(name) {
            return this.getCookie(name) || this.createCookie(name);
        },

        forEachCookie: function(callback, thisObj) {
            this._loadCookies();
            
            forEachEntry(this._cookies, function(name, cookie) {
                if (!cookie.isDeleted()) {
                    callback.call(thisObj, cookie);
                }
            });
        },

        getCookiesByName: function() {

            this._loadCookies();
            
            var cookies = {};
            
            forEachEntry(this._cookies, function(name, cookie) {
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
            forEachEntry(this._cookies, function(name, cookie) {
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
                        value = cookie.serialize ? cookie.serialize() : cookie.getValue();
                        maxAge = cookie.getMaxAge();
                    }

                    if (value == null && cookie.serialize) {
                        // We got back a null value after serializing
                        // the cookie value which means that we shouldn't
                        // write out a new cookie. However, if the cookie
                        // was previously committed then we need to now
                        // delete it
                        if (cookie.hasValue()) {
                            value = '';
                            maxAge = 0;
                        }
                        else {
                            // Cookie was not previously commited
                            return;
                        }
                    }

                    cookie.setValue(value);

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
        },

        /**
         * Returns a string consisting of JavaScript code that can be
         * used to commit the cookie in the browser.
         */
        getBrowserCommitCode: function() {
            var parts = [];

            forEachEntry(this._cookies, function(name, cookie) {
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
                        value = cookie.serialize ? cookie.serialize() : cookie.getValue();
                        maxAge = cookie.getMaxAge();
                    }

                    if (value == null && cookie.serialize) {
                        // We got back a null value after serializing
                        // the cookie value which means that we shouldn't
                        // write out a new cookie. However, if the cookie
                        // was previously committed then we need to now
                        // delete it
                        if (cookie.hasValue()) {
                            value = '';
                            maxAge = 0;
                        }
                        else {
                            // Cookie was not previously commited
                            return;
                        }
                    }

                    cookie.setValue(value);

                    cookie.setModified(false);

                    parts.push('document.cookie="' + this.getBrowserCookieCode(
                        name,
                        value,
                        domain,
                        path,
                        maxAge,
                        secure,
                        httpOnly) + '";');
                }
            }, this);

            return parts.length ? parts.join('') : null;
        },

        getBrowserCookieCode: function(name, value, domain, path, maxAge, secure, httpOnly) {
            if (httpOnly) {
                throw new Error('HttpOnly cookie not allowed');
            }

            var cookie = [];

            cookie.push(name + '=' + value);

            if (path) {
                cookie.push(';path=' + path);
            }

            if (domain) {
                cookie.push(';domain=' + domain);
            }

            if (maxAge >= 0) {
                // Instead of using the MaxAge cookie property, we use
                // Expires since it is supported by all web browsers (including IE)
                cookie.push(';expires=' + this._expires(maxAge));
            }

            if (secure) {
                cookie.push(';secure');
            }

            return cookie.join('');

        }
    };

    return CookieManager;
});
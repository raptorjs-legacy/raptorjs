var nodeCookie = require('cookie');

define.extend('raptor/cookies/CookieManager', function(require) {
    'use strict';

    var raptor = require('raptor');
    var parseOpts = {decode: function(str) { return str; }};

    return {

        _commitCookie: function(name, value, domain, path, maxAge, secure, httpOnly) {
            var headerValueParts = [name + '=' + value];

            if (domain) {
                headerValueParts.push('Domain=' + domain);
            }

            if (path) {
                headerValueParts.push('Path=' + path);
            }

            if (maxAge >= 0) {
                // Instead of using the MaxAge cookie property, we use
                // Expires since it is supported by all web browsers (including IE)
                headerValueParts.push('Expires=' + this._expires(maxAge));
            }

            if (httpOnly) {
                headerValueParts.push('HttpOnly');
            }

            if (secure) {
                headerValueParts.push('Secure');
            }

            var response = this._context.response;
            response.setHeader('Set-Cookie', headerValueParts.join('; '));
        },

        _doLoadCookies: function() {

            var request = this._context.request;
            /* Use the parsed cookies if present which
             * may be added by connect/express middleware
             */

            var cookies = request.cookies;

            var cookiesHeader = request.headers.cookie;
            if (cookiesHeader) {
                cookies = nodeCookie.parse(cookiesHeader, parseOpts);

                if (cookies) {
                    // Convert all of the cookies to raptor/cookies/Cookie
                    // objects and add them to the internal collection
                    raptor.forEachEntry(cookies, function(name, value) {
                        // Add the Cookie object to the internal collection
                        this._addCookieInternal(name, value);
                    }, this);
                }
            }
        }
    };
});
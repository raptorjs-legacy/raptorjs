define.Class('raptor/cookies/Cookie', function (require, exports, module) {
    'use strict';
    var Cookie = function (name, value, options) {
        this._name = name;
        this._value = value;
        this._domain = null;
        this._path = '/';
        //Default to the root path
        this._maxAge = -1;
        //Default to cookies that last the length of the session
        this._secure = false;
        this._httpOnly = false;
        this._deleted = false;
        this._modified = false;
        this.serialize = null;
    };
    Cookie.prototype = {
        hasValue: function () {
            return this._value != null;
        },
        setName: function (name) {
            if (this._name !== undefined) {
                throw new Error('The name of a cookie cannot be change after it is created');
            }
            this._name = name;
        },
        setValue: function (value) {
            if (value == null) {
                value = '';
            }
            if (this._value !== value) {
                this._value = value;
                this._modified = true;
            }
        },
        setDomain: function (domain) {
            this._domain = domain;
        },
        setPath: function (path) {
            this._path = path;
        },
        setMaxAge: function (maxAge) {
            this._maxAge = maxAge;
        },
        setMaxAgeDays: function (days) {
            //Convert days to seconds
            var maxAge = days * 24 * 60 * 60;
            this.setMaxAge(maxAge);
        },
        setSecure: function (secure) {
            this._secure = secure;
        },
        setHttpOnly: function (httpOnly) {
            this._httpOnly = httpOnly;
        },
        setModified: function (modified) {
            this._modified = modified;
        },
        setDeleted: function (deleted) {
            if (this._deleted !== deleted) {
                this._deleted = deleted;
                this._modified = true;
            }
        },
        getName: function () {
            return this._name;
        },
        getValue: function () {
            return this._value;
        },
        getDomain: function () {
            return this._domain;
        },
        getPath: function () {
            return this._path;
        },
        getMaxAge: function () {
            return this._maxAge;
        },
        isSecure: function () {
            return this._secure;
        },
        isHttpOnly: function () {
            return this._httpOnly;
        },
        isModified: function () {
            return this._modified === true;
        },
        isDeleted: function () {
            return this._deleted;
        }
    };
    return Cookie;
});
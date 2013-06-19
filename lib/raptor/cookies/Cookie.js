define.Class('raptor/cookies/Cookie', function(require, exports, module) {

    var Cookie = function(name, value) {
        this._name = name;
        this._value = value;
        this._domain = null;
        this._path = '/'; //Default to the root path
        this._maxAge = -1; //Default to cookies that last the length of the session
        this._secure = false;
        this._httpOnly = false;
        this._deleted = false;
        this._modified = false;
        this.serialize = null;
    };

    Cookie.prototype = {

        hasValue: function() {
            return this._value != null;
        },

        /**
         * @param {String} name
         * @return {void}
         */
        setName: function(name) {
            if (this._name !== undefined) {
                throw new Error('The name of a cookie cannot be change after it is created');
            }
            this._name = name;
        },
        
        /**
         * @param {String} value
         * @return {void}
         */        
        setValue: function(value) {
            if (value == null) {
                value = '';
            }

            if (this._value !== value) {
                this._value = value;            
                this._modified = true;
            }
        },

        /**
         * @param {String} domain
         * @return {void}
         */ 
        setDomain: function(domain) {
            this._domain = domain;
        },
        
        /**
         * @param {String} path
         * @return {void}
         */         
        setPath: function(path) {
            this._path = path;
        },
        
        /**
         * @param {Integer} seconds
         * @return {void}
         */         
        setMaxAge: function(maxAge) {
            this._maxAge = maxAge;         
        },
        
        /**
         * @param {Integer} max age in days
         * @return {void}
         */            
        setMaxAgeDays: function(days) {
            //Convert days to seconds
            var maxAge = days * 24 * 60 * 60;
            this.setMaxAge(maxAge);
        },
        
        /**
         * @param {boolean} secure
         * @return {void}
         */           
        setSecure: function(secure) {
            this._secure = secure
        },

        /**
         * @param {boolean} httpOnly
         * @return {void}
         */           
        setHttpOnly: function(httpOnly) {
            this._httpOnly = httpOnly
        },
        
        /**
         * Marks the cookie as modified/unmodified
         * @param {boolean} is modified?
         * @return {void}
         */
        setModified: function(modified) {
            this._modified = modified;
        },
        
        /**
         * Marks the cookie as deleted/not deleted
         * @param {boolean} is deleted?
         * @return {void}
         */        
        setDeleted: function(deleted) {
            if (this._deleted !== deleted) {
                this._deleted = deleted;
                this._modified = true;
            }
        },
        
        /**
         * @return {String} name
         */
        getName: function() {
            return this._name;
        },
        
        /**
         * @return {String} value
         */        
        getValue: function() {
            return this._value;
        },
        
        /**
         * @return {String} domain
         */        
        getDomain: function() {
            return this._domain;
        },

        /**
         * @return {String} path
         */
        getPath: function() {
            return this._path;
        },
        
        /**
         * @return {Integer} max age (in seconds)
         */        
        getMaxAge: function() {
            return this._maxAge;
        },
        
        /**
         * @return {boolean} is secure?
         */
        isSecure: function() {
            return this._secure;
        },

        /**
         * @return {boolean} is HTTP only?
         */
        isHttpOnly: function() {
            return this._httpOnly;
        },
        
        /**
         * @return {boolean} is modified?
         */
        isModified: function() {
            return this._modified === true;
        },
        
        /**
         * @return {boolean} is deleted?
         */
        isDeleted: function() {
            return this._deleted;
        },
    };

    return Cookie;
});
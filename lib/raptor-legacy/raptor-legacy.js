(function() {
    /*jshint strict:false */
    
    var raptor = require('raptor'),
        legacyRaptor,
        global = raptor.global,
        logging = require('raptor/logging'),
        amdDefine = global.define || raptor.createDefine();
    
    //Create a new global raptor object
    global.raptor = legacyRaptor = raptor.extend({}, raptor);

    
    var legacyNamesRE = /^(arrays|json.*|debug|listeners|loader.*|locale.*|logging|pubsub|objects|strings|templating.*|widgets)$/,
        normalize = function(id) {
            id = raptor.normalize(id);
            return legacyNamesRE.test(id) ? 'raptor/' + id : id;
        },
        normalizeIds = function(ids) {
            if (typeof ids === 'string') {
                return normalize(ids);
            }
            else {
                return ids.map(normalize);
            }
        },
        createLoggerFunction = function(name) { //Helper function invoked for each class to add a "logger()" function to the class prototype
            var _logger;
            
            return function() {
                return _logger ? _logger : (_logger = logging.logger(name));
            };
        },
        _define = function(args, isClass, isEnum, isMixin) {
            var last = args.length - 1,
                factory = args[last],
                name = args[0];

            if (typeof args[0] != 'string') {
                name = '(anonymous)';
            }

            if (typeof factory == 'function') {
                args[last] = function() {
                    

                    var o = factory(legacyRaptor),
                        mixinsTarget = o;

                    if (isClass || typeof o == 'function') {
                        isClass = 1;
                        if (typeof o != 'function') {
                            var clazz = o.init || function() {};
                            raptor.extend(clazz.prototype, o);
                            o = clazz;
                        }
                        mixinsTarget = o.prototype;
                    }

                    if (!isMixin) {
                        mixinsTarget.logger = createLoggerFunction(name);
                    }

                    if (isClass) {
                        o.getName = function() { // Return the unnormalized name
                            return name;
                        };

                        mixinsTarget.init = mixinsTarget.constructor = o; //Add init as a synonym for "constructor"
                    }

                    return o;
                };
            }

            if (isClass) {
                return amdDefine.Class.apply(amdDefine, args);
            }
            else if (isEnum) {
                return amdDefine.Enum.apply(amdDefine, args);   
            }
            else {
                return amdDefine.apply(global, args);
            }
        },
        defineModule = function() {
            return _define(arguments);
        },
        find = function(id) {
            return raptor.find(normalize(id));
        };
    
    raptor.extend(legacyRaptor, {
        require: function(ids, callback, thisObj, ignoreMissing) {
            return ignoreMissing ?
                legacyRaptor.find(ids) :
                raptor.require(normalizeIds(ids), callback, thisObj);
        },
        
        find: find,
        
        load: find,
        
        define: defineModule,

        defineModule: defineModule,

        defineClass: function() {
            return _define(arguments, 1);
        },

        defineEnum: function() {
            return _define(arguments, 0, 1);
        },

        defineMixin: function() {
            return _define(arguments, 0, 0, 1);
        },

        extend: function(target, factory) {
            if (typeof target === 'string') {
                if (typeof factory === 'function') {
                    var userFactory = factory;
                    factory = function(require, target) {
                        if (typeof target === 'function') {
                            target = target.prototype;
                        }
                        return userFactory(legacyRaptor, target);
                    };
                }
                amdDefine.extend(target, factory);
            }
            else {
                return raptor.extend(target, factory);
            }
        },

        inherit: function(clazz, superclass, copyProps) {
            raptor.inherit(clazz, typeof superclass === 'string' ? legacyRaptor.require(superclass) : superclass, copyProps);
        },
        
        /**
         * 
         * @param s
         * @returns {Boolean}
         */
        isString: function(s) {
            return typeof s == 'string';
        },
        
        /**
         * 
         * @param object
         * @returns {Boolean}
         */
        isNumber : function(object) {
            return (typeof(object) === 'number');
        },
        
        /**
         * 
         * @param s
         * @returns {Boolean}
         */
        isFunction: function(f) {
            return typeof f == 'function';
        },
        
        /**
         * 
         * @param o
         * @returns {Boolean}
         */
        isObject: function(o) {
            return typeof o == 'object';
        },
        
        /**
         * 
         * @param object
         * @returns {Boolean}
         */
        isBoolean : function(object) {
            return (typeof(object) === 'boolean');
        },
        
        isServer: function() {
            return !this.isClient();
        },
        
        isClient: function() {
            return typeof window !== undefined;
        },
        
        isArray: Array.isArray
        
    });
    
}());
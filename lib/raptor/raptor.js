(function() {
    var raptor, //The "raptor" module being created
        defs = {}, //Registered module definitions are added to this object
        getOrCreateDef = function(id) { //Returns the module definition entry for the given ID or creates one of one does not exist
            return (id && defs[id]) || (defs[id] = {postCreate: []});
        },
        cache = {}, //Loaded module cache
        separator = "/",
        lookup = {},
        slice = [].slice,
        isArray = Array.isArray, //Helper function to check if an object is an Array object
        _extend = function(target, source) { //A simple function to copy properties from one project to another
            if (!target) { //Check if a target was provided, otherwise create a new empty object to return
                target = {};
            }
            for (var propName in source) {
                if (source.hasOwnProperty(propName)) { //Only look at source properties that are not inherited
                    target[propName] = source[propName]; //Copy the property
                }
            }

            return target;
        },
        isString = function(s) {
            return typeof s == 'string';
        },
        isFunction = function(f) {
            return typeof f == 'function';
        },
        /**
         * Creates a module for the first time based on the provided factory function and provided post create functions
         * @param   {String}                   id         The ID of the module being built (not used, but simplifies code for callee)
         * @param   {Function|Object}          factory    The factory function or object instance
         * @param   {Function|Array<Function>} postCreate A function used to modify the instance before it is cached or an array of functions to modify the instance
         * @return  {Object}            [description]
         * @private
         */
        _build = function(id, factory, postCreate) {
            var instance = isFunction(factory) ? factory() : factory,
                o;

            if (postCreate) {
                raptor.forEach(postCreate, function(func) {
                    if ((o = func(instance))) { //Check if the postCreate function produced a new function... 
                        instance = o; //if so, use that instead
                    }
                });
            }
            return instance;
        },
        /**
         * Wire up the prototypes to support inheritance
         * 
         * @param   {Function} clazz    The constructor function
         * @param   {String} superclass The name of the super class
         * @param   {Boolean} copyProps If true, then all properties of the original prototype will be copied to the new prototype
         * @return  {Object}            The newly created prototype object with the prototypes chained together
         * @private
         */
        _inherit = function(clazz, superclass, copyProps) { //Helper function to setup the prototype chain of a class to inherit from another class's prototype
            
            var proto = clazz.prototype,
                F = function() {};
              
            var inherit = isString(superclass) ? _require(superclass) : superclass;

            _extend(clazz,inherit);
            
            F.prototype = inherit.prototype; 
            clazz.superclass = F.prototype;

            clazz.prototype = new F();
              
            if (copyProps) {
                _extend(clazz.prototype, proto);
            }
              
            return proto;
        },
        _instanceGetClass = function() {
            return this.constructor;
        },
        _getName = function() {
            return this.__name;
        },
        _makeClass = function(clazz, superclass, name) {
            if (!isFunction(clazz)) {
                var o = clazz;
                clazz = o.init || function() {};
                _extend(clazz.prototype, o);
            }
            
            if (superclass) {
                _inherit(clazz, superclass, true);
            }

            clazz.getName = _getName;
            clazz.__name = name;

            var proto = clazz.prototype;
            proto.constructor = clazz;
            proto.getClass = _instanceGetClass;
            
            return clazz;
        },
        _enumValueOf = function(name) {
            return this[name];
        }, 
        _enumValueOrdinal = function() {
            return this._ordinal;
        }, 
        _enumValueName = function() {
            return this._name;
        }, 
        _enumValueCompareTo = function(other) {
            return this._ordinal - other._ordinal;
        }, 
        _addEnumValue = function(target, name, EnumCtor) {
            var enumValue = target[name] = new EnumCtor();
            enumValue._ordinal = target._count++;
            enumValue._name = name;
            return enumValue;
        },
        /**
         * Normalizes a module ID by resolving relative paths (if baseName is provided)
         * and by converting all dots to forward slashes.
         *
         * Examples:
         * normalize('test.MyClass') --> 'test/MyClass'
         * normalize('./AnotherClass', 'test/MyClass') --> 'test/AnotherClass'
         * 
         * @param   {String} id       The module ID to normalize
         * @param   {String} baseName The base name for the module ID that is used to resolve relative paths. (optional)
         * @return  {String}          The normalized module ID
         * @private
         */
        _normalize = function(id, baseName) {
            if (id.charAt(0) == separator) {
                id = id.substring(1);
            }

            if (id.charAt(0) === '.') {
                if (!baseName) {
                    return id;
                }

                var idParts = id.split(separator),
                    baseNameParts = baseName.split(separator).slice(0, -1);

                for (var i=0, len=idParts.length, part; i<len; i++) {
                    part = idParts[i];

                    if (part == '..') {
                        baseNameParts.splice(baseNameParts.length-1, 1); //Remove the last element
                    }
                    else if (part != '.') {
                        baseNameParts.push(part);
                    }
                }
                
                return baseNameParts.join(separator);
            }
            else {
                return id.replace(/\./g, separator);
            }
        },
        _require = function(id, callback) {
            if (callback) {
                return _require('raptor/loader').load(id, callback);
            }

            if (cache.hasOwnProperty(id)) {
                return cache[id];
            }
            
            if (raptor.exists(id)) {
                var defEntry = defs[id];
                return (cache[id] = _build(id, defEntry.factory, defEntry.postCreate));
            }
            else {
                throw new Error(id + ' not found');
            }
        },
        /**
         * These are properties that get added to all "require" functions.
         * 
         * NOTE: The require function will always include a "normalize" function
         *       that can be used to normalize a module ID based on the context
         *       where the require was created
         */
        requireProps = {
            load: function(dependencies, callback) {
                var normalize = this.normalize;
                for (var i=0, len=dependencies.length; i<len; i++) {
                    dependencies[i] = normalize(dependencies[i]);
                }

                return _require(dependencies, callback);
            },
            
            exists: function(id) {
                return raptor.exists(this.normalize(id));
            },
            
            find: function(id) {
                return this.exists(id) ? this(id) : undefined;
            }
        },
        /**
         * These are properties that get added to all "define" functions.
         * 
         * NOTE: The define function will always include a "require" function
         *       that can be used to require other modules.
         */
        defineProps = {
            extend: function() {
                return _define(arguments, this.require, 0, 1);
            },

            Class: function() {
                return _define(arguments, this.require, 1);
            },

            Enum: function() {
                return _define(arguments, this.require, 0, 0, 1);
            }
        },
        _extendDefine = function(define) { 
            //Unfortunately functions cannot have custom prototypes so we much manually copy properties for each new instance
            return _extend(define, defineProps);
        },
        _extendRequire = function(require) {
            return _extend(require, requireProps);
        },
        /**
         * This functions takes in the arguments to define, define.Class and define.extend
         * calls and does the hard work of handling optional arguments.
         * 
         * @param   {arguments}  args The arguments object for the define, define.Class or define.extend
         * @param   {Function}  simpleRequire The function that should be used to actually perform the require of an object
         * @param   {Boolean} isClass Should only be true if this is define.Class call
         * @param   {Boolean} isExtend Should only be true if this is a define.extend call
         * @return  {Object|undefined} If no id is provided then the anonymous object is immediately built and returned. Otherwise, undefined is returned.
         * @private
         */
        _define = function(args, simpleRequire, isClass, isExtend, isEnum) {
            var i=0,
                last = args.length-1,
                finalFactory, //The function that wraps the user provided factory function to handle building the correct arguments to the user function
                arg,
                id, //The object id (optional)
                superclass, //The superclass (optional, should only be allowed for define.Class but that is not enforced currently...less code)
                enumValues,
                dependencies = [], //The dependencies arguments... defaults to an empty array
                postCreate, //A function that should be invoked after the object is created for the first time...Used to handle inheritance and to apply an extension
                factory, //The factory function or object definition (required, always the last argument)
                require = _extendRequire(function(requestedId, callback) { //This is the "require" function that the user code will see...Need to add the required props
                    return callback ? require.load(requestedId, callback) : simpleRequire(requestedId, id); //Pass along the requested ID and the base ID to the require implementation
                }),
                module = new Module(require), //Create a module object
                exports = module.exports, //Use the exports associated with the module object
                local = { //Map local functions and objects to names so that the names can be explicitly used. For example: define(['require', 'exports', 'module'], function(require, exports, module) {})
                    require: require,
                    exports: exports,
                    module: module
                },
                _gather = function() { //Converts an array of dependency IDs to the actual dependency objects (input array is modified)
                    dependencies.forEach(function(requestedId, i) {
                        var d;

                        if (!(d = local[requestedId])) { //See if the requested module is a local module and just use that module if it is
                            d = simpleRequire(requestedId, id); //Not a local module, look it up...they will do the normalization
                        }

                        dependencies[i] = d;
                    });

                    return dependencies;
                };

            require.normalize = function(requestedId) { //Helper function to normalize a module based on the parent define for the require
                return _normalize(requestedId, id);
            };

            /*
             Loop through the arguments to sort things out... 
             */
            for (; i<last; i++) {
                arg = args[i];
                if (isString(arg)) { //We found a string argument
                    if (id) { //If we already found an "id" then this string must be the superclass
                        superclass = _normalize(arg, id);
                    }
                    else { //Otherwise it is the module ID
                        id = module.id = _normalize(arg);
                    }
                }
                else if (isArray(arg)) { //We found an array...The argument must be the array of dependency IDs
                    dependencies = arg;
                }
                else if ((superclass = arg.superclass)) { //We found an object with a superclass property... Use that as the superclass
                    superclass = isString(superclass) ? _normalize(superclass) : superclass; //The superclass can either be a String or a constructor Function
                }
                else if (isEnum) {
                    enumValues = arg;
                }
                else {
                    throw new Error('Invalid call to define');
                }
            }
            
            factory = args[last]; //The factory function is always the last argument


            if (isExtend) { //If define.extend then we need to register a "post create" function to modify the target module
                postCreate = function(target) {
                    if (isFunction(target)) {
                        target = target.prototype;
                    }
                    
                    if (isFunction(factory)) {
                        factory = factory.apply(raptor, _gather().concat([require, target]));
                    }
                    
                    _extend(target, factory);
                };
            }
            else {
                if (isClass || superclass) {
                    postCreate = function(instance) {
                        var clazz = _makeClass(instance, superclass, id);
                        return clazz;  
                    };
                }
                else if (isEnum) {

                    if (isArray(factory)) {
                        enumValues = factory;
                        factory = null;
                    }

                    postCreate = function(enumClass) {
                        if (enumClass) {
                            if (typeof enumClass == 'object') {
                                enumClass = _makeClass(enumClass, 0, id); // Convert the class object definition to
                                                                   // a class constructor function
                            }
                        } else {
                            enumClass = function() {};
                        }

                        var proto = enumClass.prototype;
                        

                        enumClass._count = 0;

                        if (isArray(enumValues)) {
                            enumValues.forEach(function(name) {
                                _addEnumValue(enumClass, name, enumClass);
                            });
                        } 
                        else if (enumValues) {
                            EnumCtor = function() {};
                            EnumCtor.prototype = proto;

                            raptor.forEachEntry(enumValues, function(name, args) {
                                enumValue = _addEnumValue(enumClass, name, EnumCtor);
                                enumClass.apply(enumValue, args || []);
                            });
                        }

                        enumClass.valueOf = _enumValueOf;
                        _extend(proto, {
                            name : _enumValueName,
                            ordinal : _enumValueOrdinal,
                            compareTo : _enumValueCompareTo
                        });

                        if (proto.toString == Object.prototype.toString) {
                            proto.toString = _enumValueName;
                        }

                        return enumClass;
                    }
                }


                

                finalFactory = isFunction(factory) ?
                    function() {
                        var result = factory.apply(raptor, _gather().concat([require, exports, module]));
                        return result == undefined ? module.exports : result;
                    } :
                    factory;
            }

            return raptor.define(id, finalFactory, postCreate);
        },
        Module = function(require) {
            this.require = require;
            this.exports = {};
            this._logger = null;
        };

    Module.prototype = {
        logger: function() {
            return this._logger || (this._logger = _require('raptor/logging').logger(this.id));
        }
    };

    /**
     * @module
     * @name raptor
     * @raptor
     */
    raptor = {
        cache: cache,
        
        inherit: _inherit,

        extend: _extend,

        forEach: function(a, func, thisp) {
            if (a != null) {
                (isArray(a) ? a : [a]).forEach(func, thisp);    
            }
        },
        
        arrayFromArguments: function(args, startIndex) {
            if (!args) {
                return [];
            }
            
            if (startIndex) {
                return startIndex < args.length ? slice.call(args, startIndex) : [];
            }
            else
            {
                return slice.call(args);
            }
        },
        
        forEachEntry: function(o, fun, thisp) {
            for (var k in o)
            {
                if (o.hasOwnProperty(k))
                {
                    fun.call(thisp, k, o[k]);
                }
            }
        },
        
        createError: function(message, cause) {
            var error,
                argsLen = arguments.length,
                E = Error;
            
            if (argsLen == 2)
            {
                error = message instanceof E ? message : new E(message);            
                error._cause = cause;                        
            }
            else if (argsLen == 1)
            {            
                if (message instanceof E)
                {
                    error = message;
                }
                else
                {
                    error = new E(message);                
                }
            }
            
            return error;
        },

        /**
         * Registers a factory function or object with an ID.
         *
         * NOTE: This function does no normalization of module IDs
         *       and it executes the factory function with no arguments.
         *       
         * @param  {String}          id         The ID of the object being defined
         * @param  {Function|Object} factory    The factory function or Object instance
         * @param  {Function}        postCreate A function to execute after the object is created for the first time (optional)
         * @return {Object} Returns undefined if an "id" is provided. If an "id" is provided then the object is immediately built and returned.
         */
        define: function(id, factory, postCreate) {
            if (!id) {
                return _build.apply(raptor, arguments);
            }

            var def = getOrCreateDef(id);
            if (factory) {
                def.factory = factory;    
            }
            
            if (postCreate) {
                def.postCreate.push(postCreate);

                var instance = cache[id];

                if (instance) {
                    postCreate(instance);
                }
            }

        },

        exists: function(id) {
            return defs.hasOwnProperty(id);
        },

        require: _require,

        normalize: _normalize,

        _define: _define,

        _extendDefine: _extendDefine
    };  //End raptor


    
    
    var _global;

    if (typeof exports == 'undefined') {
        _global = window;
        
        var defineRequire = defineProps.require = function(id, baseName) {
            return _require(_normalize(id, baseName));
        };
        
        define = _extendDefine(
            function() {
                return _define(arguments, defineRequire);
            });

        require = _extendRequire(raptor.require);
        
        require.normalize = _normalize;

        define.amd = {};
    }
    else {
        _global = global;
        module.exports = raptor;
    }
    
raptor.define('raptor', raptor);
    
    /*
    The below code adds global lookup related functions that can always used
    look up objects by keys or to look up an array of objects by key. These
    functions are used by compiled code only and should not be used by
    user code directly. 
    TODO: provide a "raptor/lookup" module for user code
     */
    
    /**
     * @param  {String} category The category name for the object being added to the lookup
     * @param  {String} key      The object key
     * @param  {Object} data     The object to associate with the key
     * @return {void}
     */
    _global.$rset = function(category, key, data) {

        var catData = lookup[category];
        if (!catData) {
            catData = lookup[category] = {};
        }
        if (data !== undefined) {
            catData[key] = data;    
        }
        else {
            delete catData[key];
        }
        
    };

    _global.$radd = function(category, data) {
        var catData = lookup[category];
        if (!catData) {
            catData = lookup[category] = [];
        }
        catData.push(data);
    };

    _global.$rget = function(category, key) {
        var catData = lookup[category];
        return arguments.length === 2 ? catData && catData[key] : catData; 
    };
    
    raptor.global = _global;
}());
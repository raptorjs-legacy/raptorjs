(function() {
    /* jshint strict:false */

    var _global = (typeof window === 'undefined') ? global : window;
    if (_global.__raptor !== undefined) {
        // short-circuit raptor initialization if it already exists
        return;
    }

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

        /**
         * Extends an object with the properties of another object.
         *
         * @param  {Object} target The target object to extend (optional, if not provided an empty object is used as the target)
         * @param  {Object} source The source object with properties
         * @return {Object} The extended object
         */
        extend = function(target, source) { //A simple function to copy properties from one project to another
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
         * Utility method to iterate over elements in an Array that
         * internally uses the "forEach" property of the array.
         *
         * <p>
         * If the input Array is null/undefined then nothing is done.
         *
         * <p>
         * If the input object does not have a "forEach" method then
         * it is converted to a single element Array and iterated over.
         *
         *
         * @param  {Array|Object} a An Array or an Object
         * @param  {Function} fun The callback function for each property
         * @param  {Object} thisp The "this" object to use for the callback function
         * @return {void}
         */
        forEach = function(a, func, thisp) {
            if (a != null) {
                (a.forEach ? a : [a]).forEach(func, thisp);
            }
        },

        /**
         * Invokes a provided callback for each name/value pair
         * in a JavaScript object.
         *
         * <p>
         * <h2>Usage</h2>
         * <js>
         * raptor.forEachEntry(
         *     {
         *         firstName: "John",
         *         lastName: "Doe"
         *     },
         *     function(name, value) {
         *         console.log(name + '=' + value);
         *     },
         *     this);
         * )
         * // Output:
         * // firstName=John
         * // lastName=Doe
         * </js>
         * @param  {Object} o A JavaScript object that contains properties to iterate over
         * @param  {Function} fun The callback function for each property
         * @param  {Object} thisp The "this" object to use for the callback function
         * @return {void}
         */
        forEachEntry = function(o, fun, thisp) {
            for (var k in o)
            {
                if (o.hasOwnProperty(k))
                {
                    fun.call(thisp, k, o[k]);
                }
            }
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
                forEach(postCreate, function(func) {
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

            extend(clazz,inherit);
            
            F.prototype = inherit.prototype;
            clazz.superclass = F.prototype;

            clazz.prototype = new F();
              
            if (copyProps) {
                extend(clazz.prototype, proto);
            }
              
            return proto;
        },
        _makeClass = function(clazz, superclass, name) {
            if (!isFunction(clazz)) {
                var o = clazz;
                clazz = o.init || function() {};
                extend(clazz.prototype, o);
            }
            
            if (superclass) {
                _inherit(clazz, superclass, true);
            }

            clazz.getName = clazz.getName || function() {
                return name;
            };

            var proto = clazz.prototype;
            proto.constructor = clazz;
            proto.getClass = function() {
                return clazz;
            };
            
            return clazz;
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

            if (id.charAt(0) == '.') {
                if (!baseName) {
                    return id;
                }

                var baseNameParts = baseName.split(separator).slice(0, -1);

                forEach(id.split(separator), function(part, i) {
                    if (part == '..') {
                        baseNameParts.splice(baseNameParts.length-1, 1); //Remove the last element
                    }
                    else if (part != '.') {
                        baseNameParts.push(part);
                    }
                });

                return baseNameParts.join(separator);
            }
            else {
                return id.replace(/\./g, separator);
            }
        },
        /**
         * Resolves a module with specified ID or asynchronously resolves a set of modules if a callback function is provided.
         *
         * <p>
         * If a callback is provided then the {@Link raptor/loader} module is used to load the specified modules.
         *
         * @param   {String|Array}   id A String module ID or an Array of String module IDs (an Array is only allowed if a callback is provided)
         * @param   {Function} callback A callback function to use for asynchronous loading (optional)
         * @param   {Object}   thisObj  The "this" object to use for the callback function
         * @return  {Object} The loaded module (if synchronous) or the result of calling {@Link raptor/loader#load}
         */
        _require = function(id, callback, thisObj) {
            if (callback) {
                return _require('raptor/loader').load(id, callback, thisObj);
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
                
                if (!isArray(dependencies)) {
                    dependencies = [dependencies];
                }
                
                for (var i=0, len=dependencies.length; i<len; i++) {
                    dependencies[i] = normalize(dependencies[i]);
                }

                return _require(dependencies, callback);
            },
            
            exists: function(id) {
                return raptor.exists(this.normalize(id));
            },
            
            find: function(id) {
                
                return raptor.find(this.normalize(id));
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
            return extend(define, defineProps);
        },
        _extendRequire = function(require) {
            return extend(require, requireProps);
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
                    return callback ?
                        require.load(requestedId, callback) :
                        simpleRequire(requestedId, id); //Pass along the requested ID and the base ID to the require implementation
                }),
                module = new Module(require), //Create a module object
                exports = module.exports, //Use the exports associated with the module object
                local = { //Map local functions and objects to names so that the names can be explicitly used. For example: define(['require', 'exports', 'module'], function(require, exports, module) {})
                    require: require,
                    exports: exports,
                    module: module
                },
                getSuperclass= function() {
                    return (superclass = isString(superclass) ? require(superclass) : superclass);
                },
                _gather = function() { //Converts an array of dependency IDs to the actual dependency objects (input array is modified)
                    forEach(dependencies, function(requestedId, i) {
                        if (isString(requestedId)) {
                            var d;

                            if (!(d = local[requestedId])) { //See if the requested module is a local module and just use that module if it is
                                d = requestedId == 'super' ? getSuperclass().prototype : simpleRequire(requestedId, id); //Not a local module, look it up...they will do the normalization
                            }

                            dependencies[i] = d;
                        }
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
                else if (isEnum) {
                    enumValues = arg;
                }
                else {
                    superclass = arg.superclass;
                }
            }
            
            factory = args[last]; //The factory function is always the last argument


            if (isExtend) { //If define.extend then we need to register a "post create" function to modify the target module
                postCreate = function(target) {
                    if (isFunction(factory)) {
                        factory = factory.apply(raptor, _gather().concat([require, target]));
                    }
                    
                    if (factory) {
                        extend(isFunction(target) ? target.prototype : target, factory);
                    }
                };
            }
            else {
                if (isClass || superclass) {
                    postCreate = function(instance) {
                        return _makeClass(instance, getSuperclass(), id);
                    };
                }
                else if (isEnum) {

                    if (isArray(factory)) {
                        enumValues = factory;
                        factory = null;
                    }

                    postCreate = function(EnumClass) {
                        if (EnumClass) {
                            if (typeof EnumClass == 'object') {
                                EnumClass = _makeClass(EnumClass, 0, id); // Convert the class object definition to
                                                                          // a class constructor function
                            }
                        } else {
                            EnumClass = function() {};
                        }

                        var proto = EnumClass.prototype,
                            count = 0,
                            _addEnumValue = function(name, EnumCtor) {
                                return extend(
                                    EnumClass[name] = new EnumCtor(),
                                    {
                                        _ordinal: count++,
                                        _name: name
                                    });
                            };

                        if (isArray(enumValues)) {
                            forEach(enumValues, function(name) {
                                _addEnumValue(name, EnumClass);
                            });
                        }
                        else if (enumValues) {
                            var EnumCtor = function() {};
                            EnumCtor.prototype = proto;

                            forEachEntry(enumValues, function(name, args) {
                                EnumClass.apply(_addEnumValue(name, EnumCtor), args || []);
                            });
                        }

                        EnumClass.valueOf = function(name) {
                            return EnumClass[name];
                        };

                        extend(proto, {
                            name : _enumValueName,
                            ordinal : _enumValueOrdinal,
                            compareTo : _enumValueCompareTo
                        });

                        if (proto.toString == Object.prototype.toString) {
                            proto.toString = _enumValueName;
                        }

                        return EnumClass;
                    };
                }


                

                finalFactory = isFunction(factory) ?
                    function() {
                        var result = factory.apply(raptor, _gather().concat([require, exports, module]));
                        return result === undefined ? module.exports : result;
                    } :
                    factory;
            }

            return raptor.define(id, finalFactory, postCreate);
        },
        Module = function(require) {
            var _this = this;
            _this.require = require;
            _this.exports = {};
        };

    Module.prototype = {
        logger: function() {
            var _this = this;
            return _this.l || (_this.l = _require('raptor/logging').logger(_this.id));
        }
    };

    /**
     * The core raptor module provides an AMD implementation that can be used
     * on the server or in the web browser.
     *
     * @module
     * @name raptor
     * @raptor
     */
    _global.__raptor = raptor = {
        cache: cache,
        
        inherit: _inherit,

        extend: extend,

        forEach: forEach,
        
        /**
         * Converts a native arguments object to a native JavaScript
         * Array.
         *
         * @param  {arguments} args The arguments object
         * @param  {int} startIndex The starting index (optional)
         * @return {Array} The native JavaScript error
         */
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
        
        forEachEntry: forEachEntry,
        
        /**
         * Creates an Error object with the root cause stored. In addition,
         * this method normalizes how stack traces are recorded
         * across environments.
         *
         * <p>
         * Recommended usage:
         * <ul>
         *  <li><js>throw raptor.createError(new Error('Invalid. Exception: ' + cause), cause);</js></li>
         *  <li><js>throw raptor.createError(new Error('Invalid'));</js></li>
         * </ul>
         *
         * @param  {String|Error} message An error message or an Error object
         * @param  {Error} cause The cause of the error
         * @return {Error} The resulting Error object that can then be thrown.
         */
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

            var def = getOrCreateDef(id),
                instance;
            if (factory) {
                def.factory = factory;
            }
            
            if (postCreate) {
                def.postCreate.push(postCreate);

                if ((instance = cache[id])) {
                    postCreate(instance);
                }
            }
            
            if (typeof instance == 'object' && instance.toString === Object.prototype.toString) {
                instance.toString = function() {
                    return '[' + id + ']';
                };
            }

        },

        /**
         * Returns true if a RaptorJS AMD module with specified ID exists, false otherwise.
         *
         * @param  {String} id The ID of a module
         * @return {Boolean} true if a RaptorJS AMD module with specified ID exists, false otherwise.
         */
        exists: function(id) {
            return defs.hasOwnProperty(id);
        },
        
        /**
         * Returns an initialized RaptorJS AMD module with specified ID if it exists, undefined otherwise.
         *
         * @param  {String} id The ID of a module
         * @return {Object} an initialized RaptorJS AMD module with specified ID if it exists, undefined otherwise
         */
        find: function(id) {
            return raptor.exists(id) ? raptor.require(id) : undefined;
        },

        require: _require,

        normalize: _normalize,

        _define: _define,

        props: [requireProps, defineProps]
    };  //End raptor

    if (typeof window != 'undefined') {
        /*global require:true */
        var defineRequire = defineProps.require = function(id, baseName) {
            return _require(_normalize(id, baseName));
        };
        
        define = _extendDefine(
            function() {
                return _define(arguments, defineRequire);
            });

        require = _extendRequire(function(id, callback) {
            return isFunction(callback) ?
                require.load(id, callback) :
                _require(_normalize(id));
        });
        
        require.normalize = _normalize;

        define.amd = {};
    }
    else {
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
    


    extend(_global, {
        /**
         * @param  {String} category The category name for the object being added to the lookup
         * @param  {String} key      The object key
         * @param  {Object} data     The object to associate with the key
         * @return {void}
         */
        $rset: function(category, key, data) {
            
            if (typeof key === 'object'){
                forEachEntry(key, function(k, v){
                    $rset(category, k, v);
                });
            } else {
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
            }
            
        },

        $radd: function(category, data) {
            var catData = lookup[category];
            if (!catData) {
                catData = lookup[category] = [];
            }
            catData.push(data);
        },

        $rget: function(category, key) {
            var catData = lookup[category];
            return arguments.length == 2 ? catData && catData[key] : catData;
        }
    });

    
    raptor.global = _global;

    _global.__raptor__ = true;
}());
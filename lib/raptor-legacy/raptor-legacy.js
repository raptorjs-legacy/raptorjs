(function() {
    var raptor = require('raptor'),
        legacyRaptor,
        global = raptor.global,
        logging = require('raptor/logging'),
        amdDefine = global.define || raptor.createDefine();
    
    //Create a new global raptor object
    global.raptor = legacyRaptor = raptor.extend({}, raptor);

    
    var legacyNamesRE = /^(arrays|json.*|debug|listeners|logging|pubsub|objects|strings|templating.*|widgets)$/,
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
        define = function(args, isClass, isEnum, isMixin) {
            var last = args.length - 1,
                factory = args[last],
                name = args[0];

            if (typeof args[0] != 'string') {
                name = '(anonymous)';
            }

            if (typeof factory == 'function') {
                args[last] = function() {
                    var o = factory(legacyRaptor),
                        mixinsTarget = o.prototype ? o.prototype : o;

                    if (!isMixin) {
                        mixinsTarget.logger = createLoggerFunction(name);
                    }

                    if (isClass && o.prototype) {
                        mixinsTarget.init = o.prototype; //Add init as a synonym for "constructor"
                    }

                    return o;
                }
            }

            if (isClass) {
                return amdDefine.Class.apply(global, args);
            }
            else if (isEnum) {
                return amdDefine.Enum.apply(global, args);   
            }
            else {
                return amdDefine.apply(global, args);
            }
        },
        defineModule = function() {
            return define(arguments);
        },
        find = function(id) {
            return raptor.find(normalize(id));
        };
    
    raptor.extend(legacyRaptor, {
        require: function(ids, callback, thisObj) {
            return raptor.require(normalizeIds(ids), callback, thisObj);
        },
        
        find: find,
        
        load: find,
        
        define: defineModule,
        defineModule: defineModule,
        defineClass: function() {
            return define(arguments, 1);
        },
        defineEnum: function() {
            return define(arguments, 0, 1);
        },
        defineMixin: function() {
            return define(arguments, 0, 0, 1);
        },

        extend: function() {

        }
        
    });
    
}());
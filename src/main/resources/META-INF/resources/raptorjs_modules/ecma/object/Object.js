/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


(function() {

// ES5 15.2.3.2
if (!Object.getPrototypeOf) {
        Object.getPrototypeOf = function getPrototypeOf(object) {
                return object.constructor.prototype;
        };
}

// ES5 15.2.3.5
if (!Object.create) {
    Object.create = function create(proto,properties) {

        var Ctor = function(){};
        Ctor.prototype = proto;

        var object = new Ctor();
        if (typeof(properties) !== 'undefined') Object.defineProperties(object,properties);

        return object;

    };
}

// ES5 15.2.3.3
if (!Object.getOwnPropertyDescriptor) {

        var ERR_NON_OBJECT = 'Object.getOwnPropertyDescriptor called on a non-object: ';
        Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object,property) {
                if ((typeof object !== 'object' && typeof object !== 'function') || object === null)
                        throw new TypeError(ERR_NON_OBJECT + object);
                // If object does not owns property return undefined immediately.
                if (!owns(object,property))
                        return undefined;

                var descriptor,getter,setter;

                // If object has a property then it's for sure both `enumerable` and
                // `configurable`.
                descriptor =  { enumerable: true,configurable: true };

                // If JS engine supports accessor properties then property may be a
                // getter or setter.
                if (supportsAccessors) {
                        // Unfortunately `__lookupGetter__` will return a getter even
                        // if object has own non getter property along with a same named
                        // inherited getter. To avoid misbehavior we temporary remove
                        // `__proto__` so that `__lookupGetter__` will return getter only
                        // if it's owned by an object.
                        var prototype = object.__proto__;
                        object.__proto__ = prototypeOfObject;

                        var getter = lookupGetter(object,property);
                        var setter = lookupSetter(object,property);

                        // Once we have getter and setter we can put values back.
                        object.__proto__ = prototype;

                        if (getter || setter) {
                                if (getter) descriptor.get = getter;
                                if (setter) descriptor.set = setter;

                                // If it was accessor property we're done and return here
                                // in order to avoid adding `value` to the descriptor.
                                return descriptor;
                        }
                }

                // If we got this far we know that object has an own property that is
                // not an accessor so we set it as a value and return descriptor.
                descriptor.value = object[property];
                return descriptor;
        };
}

// ES5 15.2.3.4
if (!Object.getOwnPropertyNames) {
        Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
                return Object.keys(object);
        };
}

// ES5 15.2.3.6
if (!Object.defineProperty) {

        var ERR_NON_OBJECT_DESCRIPTOR = 'Property description must be an object: ';
        var ERR_NON_OBJECT_TARGET = 'Object.defineProperty called on non-object: ';
        var ERR_ACCESSORS_NOT_SUPPORTED = 'getters & setters can not be defined on this javascript engine';

        Object.defineProperty = function defineProperty(object,property,descriptor) {
                
                if (typeof object !== 'object' && typeof object !== 'function')
                        throw new TypeError(ERR_NON_OBJECT_TARGET + object);
                if (typeof descriptor !== 'object' || descriptor === null)
                        throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);

                // If it's a data property.
                if (owns(descriptor,'value')) {
                        // fail silently if 'writable','enumerable',or 'configurable'
                        // are requested but not supported
                        /*
                        // alternate approach:
                        if ( // can't implement these features; allow false but not true
                                !(owns(descriptor,'writable') ? descriptor.writable : true) ||
                                !(owns(descriptor,'enumerable') ? descriptor.enumerable : true) ||
                                !(owns(descriptor,'configurable') ? descriptor.configurable : true)
                        )
                                throw new RangeError(
                                        'This implementation of Object.defineProperty does not ' +
                                        'support configurable,enumerable,or writable.'
                                );
                        */

                        if (supportsAccessors && (lookupGetter(object,property) ||
                                                                            lookupSetter(object,property)))
                        {
                                // As accessors are supported only on engines implementing
                                // `__proto__` we can safely override `__proto__` while defining
                                // a property to make sure that we don't hit an inherited
                                // accessor.
                                var prototype = object.__proto__;
                                object.__proto__ = prototypeOfObject;
                                // Deleting a property anyway since getter / setter may be
                                // defined on object itself.
                                delete object[property];
                                object[property] = descriptor.value;
                                // Setting original `__proto__` back now.
                                object.__proto__ = prototype;
                        } else {
                                object[property] = descriptor.value;
                        }
                } else {
                        if (!supportsAccessors)
                                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
                        // If we got that far then getters and setters can be defined !!
                        if (owns(descriptor,'get'))
                                defineGetter(object,property,descriptor.get);
                        if (owns(descriptor,'set'))
                                defineSetter(object,property,descriptor.set);
                }

                return object;
        };
}

// ES5 15.2.3.7
if (!Object.defineProperties) {
        Object.defineProperties = function defineProperties(object,properties) {
                for (var property in properties) {
                        if (owns(properties,property))
                                Object.defineProperty(object,property,properties[property]);
                }
                return object;
        };
}

// ES5 15.2.3.8
if (!Object.seal) {
        Object.seal = function seal(object) {
                return object;
        };
}

// ES5 15.2.3.9
if (!Object.freeze) {
        Object.freeze = function freeze(object) {
                return object;
        };
}

// detect a Rhino bug and patch it
try {
        Object.freeze(function(){});
} catch (exception) {
        Object.freeze = (function freeze(freezeObject) {
                return function freeze(object) {
                        if (typeof object === 'function') {
                                return object;
                        } else {
                                return freezeObject(object);
                        }
                };
        })(Object.freeze);
}

// ES5 15.2.3.10
if (!Object.preventExtensions) {
        Object.preventExtensions = function preventExtensions(object) {
                return object;
        };
}

// ES5 15.2.3.11
if (!Object.isSealed) {
        Object.isSealed = function isSealed(object) {
                return false;
        };
}

// ES5 15.2.3.12
if (!Object.isFrozen) {
        Object.isFrozen = function isFrozen(object) {
                return false;
        };
}

// ES5 15.2.3.13
if (!Object.isExtensible) {
        Object.isExtensible = function isExtensible(object) {
                return true;
        };
}

// ES5 15.2.3.14
if (!Object.keys) {

        var hasDontEnumBug = true,
                dontEnums = ['toString','toLocaleString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','constructor'],
                dontEnumsLength = dontEnums.length;

        for (var key in {'toString': null})
                hasDontEnumBug = false;

        Object.keys = function keys(object) {

                if (
                        typeof object !== 'object' && typeof object !== 'function'
                        || object === null
                )
                        throw new TypeError('Object.keys called on a non-object');

                var keys = [];
                for (var name in object) {
                        if (owns(object,name)) {
                                keys.push(name);
                        }
                }

                if (hasDontEnumBug) {
                        for (var i = 0,ii = dontEnumsLength; i < ii; i++) {
                                var dontEnum = dontEnums[i];
                                if (owns(object,dontEnum)) {
                                        keys.push(dontEnum);
                                }
                        }
                }

                return keys;
        };

}

}());

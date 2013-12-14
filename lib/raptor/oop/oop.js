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
// Requirements:
// 1) Constructors should not be anonymous functions
// 2) Don't lose existing prototype properties when prototypes are chained
// 3) Don't mess with the prototype when defining top-level class
// 4) A Class is a constructor function

// NOTES:
// 1) Consider renaming "defineSubclass" to "extend". I like "defineSubclass" because
//    it is consistent with "defineClass"

/**
 * This module provides helpful methods for working with classes.
 * <br />
 * A Class is simply a constructor function with additional properties.
 * Once a class constructor function is converted to an raptor/oop class
 * the constructor will have a "defineSubclass" function that should be
 * used to extend the class.
 * <br />
 * The prototype and constructor function will
 * also be given a $className property if provided at time of definition
 * for reflection and debugging.
 * <br />
 * Also, the class prototype will be given a $class property that is a reference
 * to the class constructor function that created the instance.
 * <br />
 * A derived class constructor function and prototype will be given
 * a $superclass property that can be used to quickly reference the
 * base class constructor function.
 * <br />
 * The prototype of the derived class will also be given a $super property that
 * is a reference to the base class prototype.
 */
define('raptor/oop', function(require, module, exports) {
    'use strict';

    var extend = require('raptor').extend;

    function defineClass(classConstructor, className) {

        if (classConstructor.defineSubclass !== undefined) {
            return classConstructor;
        }

        // provide an method that can be used to extend this class
        classConstructor.defineSubclass = defineSubclass;
        
        // PROVIDE SOME CONVENIENCE PROPERTIES FOR REFLECTION:
        if (className !== undefined) {
            // className is optional but helps with debugging
            classConstructor.prototype.$className = classConstructor.$className = className;
        }
        // allow instance methods to access the class constructor
        classConstructor.prototype.$class = classConstructor;
        
        return classConstructor;
    }
    
    function defineSubclass(classConstructor, className) {
        // "this" is a constructor function for base class
        var Base = this;
        
        // save a reference to the prototype that the caller provided for new derived class
        var classPrototype = classConstructor.prototype;
        
        // chain the prototypes
        classConstructor.prototype = new Base();
        
        // mixin the prototype properties there were already in the prototype
        // of the subclass constructor
        extend(classConstructor.prototype, classPrototype);
        
        // PROVIDE SOME CONVENIENCE PROPERTIES FOR REFLECTION:
        // the derived class needs reference to base class (which is a constructor)
        classConstructor.prototype.$superclass = classConstructor.superclass = Base;
        // the derived class instance methods need reference to base class prototype
        classConstructor.prototype.$super = Base.prototype;
        
        // Allow "defineClass" to also provide some mixins
        // to the class constructor and prototype
        return defineClass(classConstructor, className);
    }
    
    return {
        /**
         * This method is used to modify an existing function so that it conforms to
         * class object that is used by raptor/oop module. If the given classConstructor
         * argument is already a raptor/oop class then the classConstructor will be returned
         * unchanged.
         *
         * @params {Function} classConstructor a class constructor function that will be modified to conform to raptor/oop class
         * @params {String} className an optional class name (helpful for debugging and reflection)
         * @return {Function} the classConstructor that was provided as first argument (helpful for chaining function call)
         */
        defineClass: defineClass,
    };
});
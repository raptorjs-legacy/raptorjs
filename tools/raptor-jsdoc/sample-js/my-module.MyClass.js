/**
 * Description for my-module.MyClass
 */
define(
    "my-module.MyClass",
    function(require) {
        /**
         * Description for the constructor
         * @param {String} a Param a description
         * @param {String} b Param b description
         */
        var MyClass = function(a, b) {
            this.a = a;
            this.b = b;
            this.c = "test";
        };

        MyClass.prototype = {
            hello: function(name) {
                
            }
        };

        return MyClass;
    })
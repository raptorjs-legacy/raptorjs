require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('oop spec', function() {
    
    it("should allow for module names to be resolved", function() {

        expect(raptor.normalize('./DomParser', 'xml/dom/BaseParser')).toEqual('xml/dom/DomParser');
        expect(raptor.normalize('../DomParser', 'xml/dom/BaseParser')).toEqual('xml/DomParser');
        expect(raptor.normalize('../test/DomParser', 'xml/dom/BaseParser')).toEqual('xml/test/DomParser');
    });

    it("should normalize module names", function() {
        
        var module3,
            module4;

        var initOrder = [];

        define('test.normalization.module1', function(require, exports, module) {
            initOrder.push(module.id);

            return {
                name: module.id
            }
        });

        define('test/normalization/module2', function(require, exports, module) {
            initOrder.push(module.id);

            module3 = require('./module3');

            return {
                name: module.id
            }
        });


        define('test/normalization/module3', ['./module4'], function(_module4, require, exports, module) {
            initOrder.push(module.id);

            module4 = _module4;

            return {
                name: module.id
            }
        });

        define('test/normalization/module4', function(require, exports, module) {
            initOrder.push(module.id);

            return {
                name: module.id
            }
        });
        
        expect(initOrder.length).toEqual(0);

        var module1 = require('test/normalization/module1');
        var module2 = require('test/normalization/module2');

        expect(module1.name).toEqual('test/normalization/module1');
        expect(module2.name).toEqual('test/normalization/module2');
        expect(module3.name).toEqual('test/normalization/module3');
        expect(module4.name).toEqual('test/normalization/module4');

        expect(initOrder.length).toEqual(4);
        expect(initOrder[0]).toEqual('test/normalization/module1');
        expect(initOrder[1]).toEqual('test/normalization/module2');
        expect(initOrder[2]).toEqual('test/normalization/module4');
        expect(initOrder[3]).toEqual('test/normalization/module3');
    });

    it("should allow for simple classes", function() {
        define.Class('test.classes.Class1', function(require, exports, module) {
            var Class1 = function() {

            };

            Class1.prototype = {
                getName: function() {
                    return module.id;
                }
            };

            return Class1;
        });

        define.Class('test.classes.Class2', function(require, exports, module) {
            return {
                init: function() {
                    this.id = module.id;
                },

                getName: function() {
                    return this.id;
                }
            };
        });

        var Class1 = require('test/classes/Class1');
        expect(typeof Class1).toEqual('function');
        var obj1 = new Class1();
        expect(obj1.getName()).toEqual('test/classes/Class1');


        var Class2 = require('test/classes/Class2');
        expect(typeof Class2).toEqual('function');
        var obj1 = new Class2();
        expect(obj1.getName()).toEqual('test/classes/Class2');
    });

    it("should allow for class inheritance", function() {
        define.Class('test.inheritance.SubClass', './SuperClass', function(require, exports, module) {
            var SubClass = function() {
                this.id = module.id;
            };

            SubClass.prototype = {
                getName: function() {
                    return this.id + '-' + SubClass.superclass.getName.call(this);
                }
            };

            return SubClass;
        });

        define.Class('test.inheritance.SuperClass', function(require, exports, module) {
            var SuperClass = function() {

            };

            SuperClass.prototype = {
                getName: function() {
                    return module.id;
                },

                getSuperName: function() {
                    return module.id;
                }
            };

            return SuperClass;
        });

        var SubClass2 = define.Class(
            {
                superclass: 'test.inheritance.SuperClass',
            },
            function() {
                var SubClass2 = function() {
                    this.id = 'SubClass2';
                };

                SubClass2.prototype = {
                    getName: function() {
                        return this.id + '-' + SubClass2.superclass.getName.call(this);
                    }
                };

                return SubClass2;
            });

        var SubClass = require('test/inheritance/SubClass');
        var SuperClass = require('test/inheritance/SuperClass');

        var SubClass3 = define.Class(
            {
                superclass: SuperClass,
            },
            function() {
                var SubClass3 = function() {
                    this.id = 'SubClass3';
                };

                SubClass3.prototype = {
                    getName: function() {
                        return this.id + '-' + SubClass3.superclass.getName.call(this);
                    }
                };

                return SubClass3;
            });

        expect(SubClass.superclass).toEqual(SuperClass.prototype); 
        expect(SubClass.prototype.constructor).toEqual(SubClass);
        expect(SubClass2.superclass).toEqual(SuperClass.prototype);
        expect(SubClass2.prototype.constructor).toEqual(SubClass2);
        expect(SubClass3.superclass).toEqual(SuperClass.prototype);
        expect(SubClass3.prototype.constructor).toEqual(SubClass3);

        expect(SuperClass.superclass).toEqual(undefined);
        expect(SuperClass.prototype.constructor).toEqual(SuperClass);

        
        var subObj = new SubClass();
        var subObj2 = new SubClass2();
        var subObj3 = new SubClass3();
        var superObj = new SuperClass();
        expect(subObj.getName()).toEqual('test/inheritance/SubClass-test/inheritance/SuperClass');
        expect(subObj.getSuperName()).toEqual('test/inheritance/SuperClass');
        expect(subObj2.getName()).toEqual('SubClass2-test/inheritance/SuperClass');
        expect(subObj2.getSuperName()).toEqual('test/inheritance/SuperClass');
        expect(subObj3.getName()).toEqual('SubClass3-test/inheritance/SuperClass');
        expect(subObj3.getSuperName()).toEqual('test/inheritance/SuperClass');
        expect(superObj.getName()).toEqual('test/inheritance/SuperClass');
    });

    it("should allow for module extensions", function() {
        var myModuleCalled = false,
            myModuleExtendCalled = false;

        define(
            'test.extend.my-module', 
            function(require, exports, module) {
                myModuleCalled = true;
                return {
                    a: function() {
                        return 'a';
                    },

                    b: function() {
                        return 'b';
                    }
                }
            });

        define.extend(
            'test/extend/my-module',
            function(require, target, overridden) {
                myModuleExtendCalled = true;
                return {
                    c: function() {
                        return 'c';
                    }
                }
            });

        expect(myModuleCalled).toEqual(false);
        expect(myModuleExtendCalled).toEqual(false);
        
        var myModule = require('test/extend/my-module');
        expect(myModule.a()).toEqual('a');
        expect(myModule.b()).toEqual('b');
        expect(myModule.c()).toEqual('c');

    });

    it("should allow for module extensions with dependencies", function() {
        
        var args,
            target = {};

        define(
            'test.extend.dependencies.my-module',
            function(require, exports, module) {
                return target;
            });

        define.extend(
            'test/extend/dependencies/my-module',
            ['raptor'],
            function(raptor, require, target) {
                args = arguments;
            });

        require('test/extend/dependencies/my-module');

        expect(args.length).toEqual(3);
        expect(args[0]).toEqual(require('raptor'));
        expect(typeof args[1]).toEqual('function');
        expect(args[2]).toEqual(target);

    });

    it("should allow for module extensions", function() {
        var myClassCalled = false,
            myClassExtendCalled = false;

        define.Class('test.extend.MyClass', function(require, exports, module) {
            myClassCalled = true;

            var MyClass = function() {

            };

            MyClass.prototype = {
                a: function() {
                    return 'a';
                },

                b: function() {
                    return 'b';
                }
            };

            return MyClass;
        });

        define.extend(
            'test.extend.MyClass', 
            function(require, exports, module) {
                myClassExtendCalled = true;
                return {
                    c: function() {
                        return 'c';
                    }
                }
            });
        
        var MyClass = require('test/extend/MyClass');
        expect(MyClass.prototype.a).toNotEqual(null);
        expect(MyClass.prototype.b).toNotEqual(null);
        expect(MyClass.prototype.c).toNotEqual(null);

        var myObj = new MyClass();
        expect(myObj.a()).toEqual('a');
        expect(myObj.b()).toEqual('b');
        expect(myObj.c()).toEqual('c');

        expect(myClassCalled).toEqual(true);
        expect(myClassExtendCalled).toEqual(true);
    });

    it("should allow module objects instead of factory functions", function() {
        
        define('test.module-objects.module1', {
            name: 'module1'
        });

        var module1 = require('test/module-objects/module1');
        expect(module1.name).toEqual('module1');
    });

    it("should allow for module objects to have a logger", function() {
        define('test/module-logger/my-module', function(require, exports, module) {
            var logger = module.logger();

            return {
                sayHello: function() {
                    logger.info("Hello from " + module.id);
                }
            }
        });

        require('test/module-logger/my-module').sayHello();
    });


});
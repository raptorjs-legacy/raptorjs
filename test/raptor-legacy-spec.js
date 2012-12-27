require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

raptor.find('raptor-legacy');


var legacyRaptor = global.raptor;

describe('legacy raptor module', function() {

    it('should support normalizing module IDs', function() {
        expect(legacyRaptor.require('json')).toEqual(raptor.require('raptor/json'));
        expect(legacyRaptor.require('json.stringify')).toEqual(raptor.require('raptor/json/stringify'));
        expect(legacyRaptor.require('json.parse')).toEqual(raptor.require('raptor/json/parse'));
        expect(legacyRaptor.require('debug')).toEqual(raptor.require('raptor/debug'));
        expect(legacyRaptor.require('listeners')).toEqual(raptor.require('raptor/listeners'));
        expect(legacyRaptor.require('logging')).toEqual(raptor.require('raptor/logging'));
        expect(legacyRaptor.require('pubsub')).toEqual(raptor.require('raptor/pubsub'));
        expect(legacyRaptor.require('objects')).toEqual(raptor.require('raptor/objects'));
        expect(legacyRaptor.require('strings')).toEqual(raptor.require('raptor/strings'));
        expect(legacyRaptor.require('templating')).toEqual(raptor.require('raptor/templating'));
        expect(legacyRaptor.require('templating.compiler')).toEqual(raptor.require('raptor/templating/compiler'));
        expect(legacyRaptor.require('widgets')).toEqual(raptor.require('raptor/widgets'));
    });

    it('should support legacy modules', function() {
        var myModule = {},
            args;

        legacyRaptor.define('test.my-module', function() {
            args = arguments;
            return myModule;
        });

        var returnedMyModule = legacyRaptor.require('test.my-module');
        expect(returnedMyModule).toEqual(myModule);
        expect(args.length).toEqual(1);
        expect(args[0]).toEqual(legacyRaptor);
        expect(myModule.logger()).toNotEqual(null);
        expect(myModule.logger().debug).toNotEqual(null);
        myModule.logger().debug('Test');
    });

    it('should support legacy classes declared using prototype', function() {
        var args;

        function MyClass() {

        }

        MyClass.prototype = {

        }

        legacyRaptor.defineClass('test.MyClass', function() {
            args = arguments;
            return MyClass;
        });

        var returnedMyClass = legacyRaptor.require('test.MyClass');
        expect(returnedMyClass).toEqual(MyClass);
        expect(args.length).toEqual(1);
        expect(args[0]).toEqual(legacyRaptor);
        expect(MyClass.prototype.init).toEqual(MyClass);
        expect(MyClass.prototype.constructor).toEqual(MyClass);
    });

    it('should support legacy classes declared using an object as prototype', function() {
        var args;

        var MyClassProto = {
            init: function() {

            },

            sayHello: function() {
                return "Hello";
            }
        }

        legacyRaptor.defineClass('test.MyClass2', function() {
            args = arguments;
            return MyClassProto;
        });

        var returnedMyClass = legacyRaptor.require('test.MyClass2');
        expect(returnedMyClass).toEqual(MyClassProto.init);
        expect(args.length).toEqual(1);
        expect(args[0]).toEqual(legacyRaptor);
        expect(returnedMyClass.prototype.init).toEqual(MyClassProto.init);
        expect(returnedMyClass.prototype.constructor).toEqual(MyClassProto.init);
        expect(returnedMyClass.prototype.sayHello).toNotEqual(null);
    });

    it('should support legacy classes with superclasses', function() {

        var PersonArgs,
            EmployeeArgs;

        function Person(name) {
            this.name = name;
        }

        Person.prototype = {
            getName: function() {
                return this.name
            }
        };

        function Employee(name, company) {
            Employee.superclass.constructor.call(this, name);
            this.company = company;
        }

        Employee.prototype = {
            getCompany: function() {
                return this.company;
            }
        };

        legacyRaptor.defineClass('test.Person', function() {
            PersonArgs = arguments;
            return Person;
        });

        legacyRaptor.defineClass('test.Employee', 'test.Person', function() {
            EmployeeArgs = arguments;
            return Employee;
        });


        var Employee = legacyRaptor.require('test.Employee');
        expect(EmployeeArgs.length).toEqual(1);
        expect(EmployeeArgs[0]).toEqual(legacyRaptor);

        expect(PersonArgs.length).toEqual(1);
        expect(PersonArgs[0]).toEqual(legacyRaptor);

        var employeeA = new Employee('John', 'eBay');
        var employeeB = new Employee('Jane', 'PayPal');

        expect(employeeA.getName()).toEqual('John');
        expect(employeeA.getCompany()).toEqual('eBay');

        expect(employeeB.getName()).toEqual('Jane');
        expect(employeeB.getCompany()).toEqual('PayPal');
    });

    it('should support extensions for legacy modules', function() {
        var myBaseModule = {},
            extendArgs;

        legacyRaptor.define('test.my-base-module', function() {
            return myBaseModule;
        });

        legacyRaptor.extend('test.my-base-module', function() {
            extendArgs = arguments;
            return {
                newMethod: function() {

                }
            };
        });

        var returnedMyModule = legacyRaptor.require('test.my-base-module');
        expect(returnedMyModule).toEqual(myBaseModule);
        expect(typeof returnedMyModule.newMethod).toEqual('function');

        expect(extendArgs.length).toEqual(2);
        expect(extendArgs[0]).toEqual(legacyRaptor);
        expect(extendArgs[1]).toEqual(myBaseModule);
    });
});

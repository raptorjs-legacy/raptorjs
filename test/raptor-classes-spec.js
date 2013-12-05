require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

define.Class(
    'test.classes.Bird', 
    function(require) {
        return {
            init: function(species) {
                this.species = species;
            },
            
            getSpecies: function() {
                return this.species;
            },
            
            isFlighted: function() {
                return true;
            },
            
            toString: function() {
                return '[Bird: ' + this.getSpecies() + ']';
            }
        };
    });
    
define.Class(
    'test.classes.Ostrich',
    {
        superclass: 'test.classes.Bird'
    },
    function(require) {
        var Ostrich = function() {
            Ostrich.superclass.init.call(this, 'ostrich');
        };
        
        Ostrich.prototype = {
            isFlighted: function() {
                return false;
            },
            
            isOstrich: function() {
                return true;
            },
            
            toString: function() {
                return Ostrich.superclass.toString.call(this);
            }
        };
        
        return Ostrich;
    });

define.Class(
    'test.classes.Ostrich2',
    'test.classes.Bird',
    ['super'],
    function($super, require) {

        var Ostrich = function() {
            $super.constructor.call(this, 'ostrich');
        };
        
        Ostrich.prototype = {
            isFlighted: function() {
                return false;
            },
            
            isOstrich: function() {
                return true;
            },
            
            toString: function() {
                return $super.toString.call(this);
            }
        };
        
        return Ostrich;
    });

define.Class('test.syntax.AlternativeSuperClass', function(require) {
    var Type = function(message) {
        this.initMessage = message;
        this.initB = true;
    };
    
    Type.prototype = {
        myMethod: function(message) {
            this.b = true;
            this.methodMessage = message;
        }
    };
    
    Type.mySuperStatic = true;
    
    return Type;
});

define.Class(
    'test.syntax.AlternativeClass', 
    {
        superclass: 'test.syntax.AlternativeSuperClass'
    },
    function(require) {
        var Type = function(message) {
            
            Type.superclass.constructor.call(this, message);
            this.initA = true;
        };
        
        
        Type.prototype = {
            myMethod: function(message) {
                this.a = true;
                Type.superclass.myMethod.call(this, message);
            },
            
            myMethod2: function(message) {
                this.a = true;
                Type.superclass.myMethod.call(this, message);
            }
        };
        
        Type.myStatic = true;
        
        return Type;
    });

define(
    'test.mixins.BirdMixins',
    function(require) {
        return {
            fly: function() {
                
            }
        };
    });

define(
    'test.mixins.Ostrich',
    ['raptor'],
    function(raptor, require) {
        var Ostrich = function() {
            
        };
        
        Ostrich.prototype = {
            isFlighted: function() {
                return false;
            },
            
            isOstrich: function() {
                return true;
            },
            
            toString: function() {
                return Ostrich.superclass.toString.call(this);
            }
        };
        
        raptor.extend(
            Ostrich.prototype, 
            require('test.mixins.BirdMixins'));
        
        return Ostrich;
    });

describe('classes module', function() {

    var Ostrich = require('test.classes.Ostrich');
    
    var ostrich = new Ostrich();
    
    it('should allow inheritance', function() {
        expect(ostrich.getSpecies()).toEqual('ostrich');
        expect(ostrich.isFlighted()).toEqual(false);
        expect(ostrich.isOstrich()).toEqual(true);
        expect(ostrich.toString()).toEqual('[Bird: ostrich]');
    });

    it('should support external classes', function() {
       var TestClass = require('TestClass');
       expect(TestClass).toNotEqual(null);
    });
    
    it('should allow anonymous classes', function() {
        var AnonClass = define.Class(function(raptor) {
            return {
                testMethod: function() {
                    return true;
                }
            };
        });
        
        var anonObj = new AnonClass();
        expect(anonObj.testMethod()).toEqual(true);
     });
    
    it('should allow anonymous classes with superclasses', function() {
        var AnonClass = define.Class(
            {
                superclass: 'test.classes.Bird'
            },
            function(raptor) {
                var AnonClass = function() {
                    AnonClass.superclass.init.call(this, "test");
                };
                
                AnonClass.prototype = {
                    testMethod: function() {
                        return true;
                    }
                };
                
                return AnonClass;
            });
        
        var anonObj = new AnonClass();
        expect(anonObj.testMethod()).toEqual(true);
        expect(anonObj.getSpecies()).toEqual("test");
        
     });
    
    it('should allow statics', function() {
        var AnonClass = define.Class(function(raptor) {
            return {
                statics: {
                    staticMethod: function() {
                        return true;
                    }
                },
                testMethod: function() {
                    return true;
                }
            };
        });
        
        var anonObj = new AnonClass();
        expect(anonObj.testMethod()).toEqual(true);
        expect(anonObj.testMethod()).toEqual(true);
     });
    
    it('should allow class factory functions to return constructor functions', function() {
        var AlternativeClass = require('test.syntax.AlternativeClass');
        expect(AlternativeClass.myStatic).toEqual(true);
        
        var myAlternative = new AlternativeClass('AlternativeClass');
        expect(myAlternative.initA).toEqual(true);
        expect(myAlternative.initB).toEqual(true);
        expect(myAlternative.initMessage).toEqual('AlternativeClass');
        
        myAlternative.myMethod('AlternativeClass.myMethod');        
        expect(myAlternative.methodMessage).toEqual('AlternativeClass.myMethod');
        
        myAlternative.myMethod2('AlternativeClass.myMethod2');        
        expect(myAlternative.methodMessage).toEqual('AlternativeClass.myMethod2');
        
        expect(myAlternative.a).toEqual(true);
        expect(myAlternative.b).toEqual(true);
        
    });
    
    it('should allow instanceof to be used', function() {
        var AlternativeClass = require('test.syntax.AlternativeClass');
        var AlternativeSuperClass = require('test.syntax.AlternativeSuperClass');
        
        var myAlternative = new AlternativeClass('AlternativeClass');
        expect(myAlternative instanceof AlternativeClass).toEqual(true);
        expect(myAlternative instanceof AlternativeSuperClass).toEqual(true);
        
        var mySuperAlternative = new AlternativeSuperClass('AlternativeSuperClass');
        expect(mySuperAlternative instanceof AlternativeClass).toNotEqual(true);
        
        var Ostrich = require('test.classes.Ostrich');
        var ostrich = new Ostrich();
        expect(ostrich instanceof Ostrich).toEqual(true);
        
    });
    
    it('should make all superclass name as the modifiers', function() {
        
        var Ostrich2 = require('test.classes.Ostrich2');
        var ostrich = new Ostrich2();
        expect(ostrich.getSpecies()).toEqual('ostrich');
        expect(ostrich.isFlighted()).toEqual(false);
        expect(ostrich.isOstrich()).toEqual(true);
        expect(ostrich.toString()).toEqual('[Bird: ostrich]');
        
    });
    
    it('should allow classes to be in the modules namespace', function() {
        define.Class('globalTest.myModule.MyClass', function(require) {
            return {
                
            };
        });
        
        expect(require("globalTest.myModule.MyClass")).toNotEqual(null);

        define('globalTest.myModule', function(require) {
            return {
                
            };
        });
        
        var myModule = require('globalTest.myModule');
        
        expect(require("globalTest.myModule.MyClass")).toNotEqual(null);
    });
    
    xit('should allow instanceof against classes accessed using the global namespace', function() {
        define.Class('instanceOfTest.myModule.MyClass', function(require) {
            return {
                
            };
        });
        
        var MyClass = instanceOfTest.myModule.MyClass;
        
        var myObject = new MyClass();
        expect(myObject instanceof MyClass).toEqual(true);
        
       
    });
    
    it('should allow instanceof against classes accessed using require', function() {
        define.Class('instanceOfTest2.myModule.MyClass', function(require) {
            return {
                
            };
        });
        
        var MyClass = require('instanceOfTest2.myModule.MyClass');
        var myObject = new MyClass();
        
        expect(myObject instanceof MyClass).toEqual(true);
    });
    
    it('should allow static in classes accessed using require', function() {
        define.Class('globalStaticsTest.myModule.MyClass', function() {
            var MyClass = function() {};
            MyClass.SOME_STATIC = true;
            return MyClass;
        });
        
        var MyClass = require('globalStaticsTest.myModule.MyClass');
        expect(MyClass.SOME_STATIC).toEqual(true);
    });
    
    it('should allow for mixins', function() {
        var Ostrich = require('test.mixins.Ostrich');
        var ostrich = new Ostrich();
        expect(ostrich.fly).toNotEqual(null);
    });
    
});
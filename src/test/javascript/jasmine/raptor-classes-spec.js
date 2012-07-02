raptor.defineClass(
    'test.classes.Bird', 
    function(raptor, type) {
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
    
raptor.defineClass(
    'test.classes.Ostrich',
    {
        superclass: 'test.classes.Bird'
    },
    function(raptor, type) {
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

raptor.defineClass(
    'test.classes.Ostrich2',
    'test.classes.Bird',
    function(raptor, type) {
        var Ostrich = function() {
            Ostrich.superclass.constructor.call(this, 'ostrich');
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

raptor.defineClass('test.syntax.AlternativeSuperClass', function(raptor) {
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

raptor.defineClass(
    'test.syntax.AlternativeClass', 
    {
        superclass: 'test.syntax.AlternativeSuperClass'
    },
    function(raptor, helper) {
        var Type = function(message) {
            
            Type.superclass.init.call(this, message);
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

raptor.defineMixin(
    'test.mixins.BirdMixins',
    function(raptor) {
        return {
            fly: function() {
                
            }
        };
    });
raptor.defineClass(
        'test.mixins.Ostrich',
        {
            mixins: ['test.mixins.BirdMixins']
        },
        function(raptor, type) {
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
            
            return Ostrich;
        });

describe('classes module', function() {

    before(function() {
        createRaptor();
        raptor.resources.addSearchPathDir(getTestsDir('test-classes'));
    });
    
    var Ostrich = raptor.require('test.classes.Ostrich');
    
    var ostrich = new Ostrich();
    
    it('should allow inheritance', function() {
        expect(ostrich.getSpecies()).toEqual('ostrich');
        expect(ostrich.isFlighted()).toEqual(false);
        expect(ostrich.isOstrich()).toEqual(true);
        expect(ostrich.toString()).toEqual('[Bird: ostrich]');
    });
    
//    it('should allow imports', function() {
//       var imports = raptor.requireAll(
//               'test.classes.Bird',
//               'test.classes.Ostrich'
//               );
//       
//       var Bird = raptor.require('test.classes.Bird');
//       var Ostrich = raptor.require('test.classes.Ostrich');
//       
//       expect(Bird).toEqual(imports.Bird);
//       expect(Ostrich).toEqual(imports.Ostrich);
//       
//    });
    
    it('should support external classes', function() {
       var TestClass = raptor.require('TestClass');
       expect(TestClass).toNotEqual(null);
    });
    
    it('should allow anonymous classes', function() {
        var AnonClass = raptor.defineClass(function(raptor) {
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
        var AnonClass = raptor.defineClass(
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
        var AnonClass = raptor.defineClass(function(raptor) {
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
        var AlternativeClass = raptor.require('test.syntax.AlternativeClass');
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
        var AlternativeClass = raptor.require('test.syntax.AlternativeClass');
        var AlternativeSuperClass = raptor.require('test.syntax.AlternativeSuperClass');
        
        var myAlternative = new AlternativeClass('AlternativeClass');
        expect(myAlternative instanceof AlternativeClass).toEqual(true);
        expect(myAlternative instanceof AlternativeSuperClass).toEqual(true);
        
        var mySuperAlternative = new AlternativeSuperClass('AlternativeSuperClass');
        expect(mySuperAlternative instanceof AlternativeClass).toNotEqual(true);
        
        var Ostrich = raptor.require('test.classes.Ostrich');
        var ostrich = new Ostrich();
        expect(ostrich instanceof Ostrich).toEqual(true);
        
    });
    
    it('should make all instances loggers', function() {
        
        var Ostrich = raptor.require('test.classes.Ostrich');
        var ostrich = new Ostrich();
        expect(ostrich.logger().error).toNotEqual(null);
        ostrich.logger().error('Test error message');
        
    });
    
    it('should make all superclass name as the modifiers', function() {
        
        var Ostrich2 = raptor.require('test.classes.Ostrich2');
        var ostrich = new Ostrich2();
        expect(ostrich.getSpecies()).toEqual('ostrich');
        expect(ostrich.isFlighted()).toEqual(false);
        expect(ostrich.isOstrich()).toEqual(true);
        expect(ostrich.toString()).toEqual('[Bird: ostrich]');
        
    });
    
    it('should allow classes to be in the modules namespace', function() {
        raptor.defineClass('globalTest.myModule.MyClass', function() {
            return {
                
            };
        });
        
        expect(raptor.require("globalTest.myModule.MyClass")).toNotEqual(null);

        raptor.defineModule('globalTest.myModule', function() {
            return {
                
            };
        });
        
        var myModule = raptor.require('globalTest.myModule');
        
        expect(raptor.require("globalTest.myModule.MyClass")).toNotEqual(null);
    });
    
    xit('should allow instanceof against classes accessed using the global namespace', function() {
        raptor.defineClass('instanceOfTest.myModule.MyClass', function() {
            return {
                
            };
        });
        
        var MyClass = instanceOfTest.myModule.MyClass;
        
        var myObject = new MyClass();
        expect(myObject instanceof MyClass).toEqual(true);
        
       
    });
    
    it('should allow instanceof against classes accessed using raptor.require', function() {
        raptor.defineClass('instanceOfTest2.myModule.MyClass', function() {
            return {
                
            };
        });
        
        var MyClass = raptor.require('instanceOfTest2.myModule.MyClass');
        var myObject = new MyClass();
        
        expect(myObject instanceof MyClass).toEqual(true);
    });
    
    xit('should allow static in classes accessed using the global namespace', function() {
        raptor.defineClass('globalStaticsTest.myModule.MyClass', function() {
            var MyClass = function() {};
            MyClass.SOME_STATIC = true;
            return MyClass;
        });
        
        var MyClass = globalStaticsTest.myModule.MyClass;
        expect(MyClass.SOME_STATIC).toEqual(true);
    });
    
    it('should allow static in classes accessed using raptor.require', function() {
        raptor.defineClass('globalStaticsTest.myModule.MyClass', function() {
            var MyClass = function() {};
            MyClass.SOME_STATIC = true;
            return MyClass;
        });
        
        var MyClass = raptor.require('globalStaticsTest.myModule.MyClass');
        expect(MyClass.SOME_STATIC).toEqual(true);
    });
    
    it('should allow for mixins', function() {
        var Ostrich = raptor.require('test.mixins.Ostrich');
        var ostrich = new Ostrich();
        expect(ostrich.fly).toNotEqual(null);
    });
    

});
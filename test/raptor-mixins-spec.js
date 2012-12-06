require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);


xdescribe('raptor mixins', function() {

    it('should support mixins for modules and classes', function() {
        raptor.defineMixin(
            'test.mixins.MixinA',
            function() {
                return {
                    mixinAArgs: arguments,
                    a1: true,
                    a2: true
                };
            });

        raptor.defineMixin(
            'test.mixins.MixinB',
            function(raptor, target, overridden) {
                this.mixinBArgs = arguments;
                this.b1 = true;
                this.b2 = true;
            });
                

        raptor.defineMixin(
            'test.mixins.MixinC',
            function(raptor, target, overridden) {
                
                return {
                    mixinCArgs: arguments,
                    c1: true,
                    c2: true,
                    myName: function() {
                        return overridden.myName() + '-test.mixins.MixinC';
                    }
                };
            });

        var mixinDInitCount = 0;
        
        raptor.defineMixin(
            'test.mixins.MixinD',
            {
                singleton: true
            },
            function(raptor) {
                mixinDInitCount++;
                
                return {
                    mixinDArgs: arguments,
                    d1: true,
                    d2: true
                };
            });
        
        raptor.defineMixin(
                'test.mixins.MixinE',
                function() {
                    return {
                        mixinEArgs: arguments,
                        e1: true,
                        e2: true
                    };
                });
        
        var originalModuleAMyName = function() {
            return 'test.mixins.moduleA';
        };
        
        
    
        raptor.define(
            'test.mixins.moduleA',
            {
                mixins: ['test.mixins.MixinA',
                         'test.mixins.MixinB',
                         'test.mixins.MixinC',
                         'test.mixins.MixinD']
            },
            function(raptor) {
                return {
                    myName: originalModuleAMyName
                };
            });
        
        var originalClassAMyName = function() {
            return 'test.mixins.ClassA';
        };
        
        var classAProto = {
                myName: originalClassAMyName
            };
        
        define.Class(
            'test.mixins.ClassA',
            {
                mixins: ['test.mixins.MixinA',
                         'test.mixins.MixinB',
                         'test.mixins.MixinC',
                         'test.mixins.MixinD']
            },
            function(require) {
                var MyClass = function() {
                    
                };
                
                raptor.extend(MyClass, 'test.mixins.MixinE');
                
                MyClass.prototype = classAProto;
                
                return MyClass;
            });
        
        var moduleA = require('test.mixins.moduleA');
        expect(moduleA.myName()).toEqual('test.mixins.moduleA-test.mixins.MixinC');
        expect(moduleA.a1).toEqual(true);
        expect(moduleA.a2).toEqual(true);
        expect(moduleA.b1).toEqual(true);
        expect(moduleA.b2).toEqual(true);
        expect(moduleA.c1).toEqual(true);
        expect(moduleA.c2).toEqual(true);
        expect(moduleA.d1).toEqual(true);
        expect(moduleA.d2).toEqual(true);
        
        expect(moduleA.mixinAArgs[0]).toEqual(raptor);
        expect(moduleA.mixinAArgs[1]).toEqual(moduleA);
        expect(raptor.objects.isEmpty(moduleA.mixinAArgs[2])).toEqual(true);
        
        expect(moduleA.mixinBArgs[0]).toEqual(raptor);
        expect(moduleA.mixinBArgs[1]).toEqual(moduleA);
        expect(raptor.objects.isEmpty(moduleA.mixinBArgs[2])).toEqual(true);
        
        expect(moduleA.mixinCArgs[0]).toEqual(raptor);
        expect(moduleA.mixinCArgs[1]).toEqual(moduleA);
        expect(raptor.objects.isEmpty(moduleA.mixinCArgs[2])).toEqual(false);
        expect(moduleA.mixinCArgs[2].hasOwnProperty('myName')).toEqual(true);
        expect(moduleA.mixinCArgs[2].myName).toEqual(originalModuleAMyName);
        
        var ClassA = require('test.mixins.ClassA');
        var objA = new ClassA();
        expect(objA.myName()).toEqual('test.mixins.ClassA-test.mixins.MixinC');
        expect(objA.a1).toEqual(true);
        expect(objA.a2).toEqual(true);
        expect(objA.b1).toEqual(true);
        expect(objA.b2).toEqual(true);
        expect(objA.c1).toEqual(true);
        expect(objA.c2).toEqual(true);
        expect(objA.d1).toEqual(true);
        expect(objA.d2).toEqual(true);
        
        expect(objA.mixinAArgs[0]).toEqual(raptor);
        expect(objA.mixinAArgs[1]).toEqual(classAProto);
        expect(raptor.objects.isEmpty(objA.mixinAArgs[2])).toEqual(true);
        
        expect(objA.mixinBArgs[0]).toEqual(raptor);
        expect(objA.mixinBArgs[1]).toEqual(classAProto);
        expect(raptor.objects.isEmpty(objA.mixinBArgs[2])).toEqual(true);
        
        expect(objA.mixinCArgs[0]).toEqual(raptor);
        expect(objA.mixinCArgs[1]).toEqual(classAProto);
        expect(raptor.objects.isEmpty(objA.mixinCArgs[2])).toEqual(false);
        expect(objA.mixinCArgs[2].hasOwnProperty('myName')).toEqual(true);
        expect(objA.mixinCArgs[2].myName).toEqual(originalClassAMyName);
        
        expect(ClassA.e1).toEqual(true);
        expect(ClassA.e2).toEqual(true);
        expect(ClassA.getName()).toEqual('test.mixins.ClassA');
        expect(mixinDInitCount).toEqual(1);
        
        expect(ClassA.mixinEArgs[0]).toEqual(raptor);
        expect(ClassA.mixinEArgs[1]).toEqual(ClassA);
        expect(raptor.objects.isEmpty(ClassA.mixinEArgs[2])).toEqual(true);
    });
    


});
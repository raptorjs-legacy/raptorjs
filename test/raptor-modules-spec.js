require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('modules module', function() {

    it('should allow module with no mixins', function() {
        var simple = require('test/simple');
        expect(simple.testMethod()).toEqual('testMethod');
    });
    
    it('should allow module with extensions', function() {
        var extensions = require('test/extensions');
        expect(extensions.env()).toEqual('server');
        expect(extensions.getMessage()).toEqual('Test');
    });
    
    it('should allow module with extension patterns', function() {
        var extensionPatterns = require('test/extension-patterns');
        expect(extensionPatterns.env()).toEqual('server');
        expect(extensionPatterns.getMessage()).toEqual('Test');
    });


    it('should allow non-external modules', function() {
        define('test/myLocalModule', function() {
            return {
                localModuleMethod: function() {
                    return true;
                }
            };
        });
        
        var myLocalModule = require('test/myLocalModule');
        expect(myLocalModule.localModuleMethod()).toEqual(true);
    });
    
    it('should allow modules with sub-files', function() {
        var moduleWithFiles = require('test/moduleWithFiles');
        expect(moduleWithFiles.createTestObject().testMethod()).toEqual(true);
    });
    
    it('should allow module manifests to be read', function() {
        var coreManifest = require('raptor/packaging').getModuleManifest('raptor');
        expect(coreManifest).toNotEqual(null);
        
        var modules = {};
        
        coreManifest.forEachDependency({
            callback: function(type, include) {
                if (include.type === 'module') {
                    modules[include.name] = true;
                }
            }
        });
        
        expect(modules['raptor/logging']).toEqual(true);
        
        
    });
    
    it('should allow modules to be extended lazily using the extend function', function() {
        define('extendLazy', function() {
            return {
                test: function() {
                    this.testExecuted = true;
                }
            };
        });
        
        define.extend('extendLazy', function(raptor, target) {
                target.test();
            });
        
        var extendLazy = require('extendLazy');
        expect(extendLazy.testExecuted).toEqual(true);
    });
    
    it('should allow modules to have conditionals', function() {
        
        require('raptor/packaging').enableExtension("test.conditionals");
        require('raptor/packaging').enableExtension("test.conditionals.a");
        
        var conditional = require('test.conditional-extensions');
        expect(conditional["default"]).toEqual(true);
        expect(conditional["test"]).toEqual(true);
        expect(conditional["test2"]).toNotEqual(true);
        expect(conditional["test3"]).toNotEqual(true);
    });
    
    it("should throw an error when a missing module is requested to be loaded", function() {
        var missingError;
        try
        {
            require('raptor').require("MISSING_MODULE");
        }
        catch(e) {
            missingError = e;
        }
        
        expect(missingError).toNotEqual(null);        
    });
});

describe('modules module', function() {

    before(function() {
        createRaptor();
        raptor.resources.addSearchPathDir(getTestsDir('test-modules'));
    });
    
    

    it('should allow module with no mixins', function() {
        var simple = raptor.require('test/simple');
        expect(simple.testMethod()).toEqual('testMethod');
    });
    
    it('should allow module with extensions', function() {
        var extensions = raptor.require('test/extensions');
        expect(extensions.env()).toEqual('server');
        expect(extensions.getMessage()).toEqual('Test');
    });
    
    it('should allow non-external modules', function() {
        raptor.defineModule('test/myLocalModule', function() {
            return {
                localModuleMethod: function() {
                    return true;
                }
            };
        });
        
        var myLocalModule = raptor.require('test/myLocalModule');
        expect(myLocalModule.localModuleMethod()).toEqual(true);
    });
    
    it('should allow modules with sub-files', function() {
        var moduleWithFiles = raptor.require('test/moduleWithFiles');
        expect(moduleWithFiles.createTestObject().testMethod()).toEqual(true);
    });
    
    it('should allow module manifests to be read', function() {
        var coreManifest = raptor.oop.getModuleManifest('core');
        expect(coreManifest).toNotEqual(null);
        
        var modules = {};
        
        coreManifest.forEachInclude({
            callback: function(type, include) {
                if (include.type === 'module') {
                    modules[include.name] = true;
                }
            }
        });
        
        expect(modules['logging']).toEqual(true);
        
        
    });
    
    it('should allow modules to be extended lazily using the extend function', function() {
        raptor.defineModule('extendLazy', function() {
            return {
                test: function() {
                    this.testExecuted = true;
                }
            };
        });
        
        raptor.extend('extendLazy', {
            extend: function(target) {
                target.test();
            }
        });
        
        var extendLazy = raptor.require('extendLazy');
        expect(extendLazy.testExecuted).toEqual(true);
    });
    
    it('should allow modules to have conditionals', function() {
        
        raptor.require('packager').enableExtension("test.conditionals");
        raptor.require('packager').enableExtension("test.conditionals.a");
        
        var conditional = raptor.require('test.conditional-extensions');
        expect(conditional["default"]).toEqual(true);
        expect(conditional["test"]).toEqual(true);
        expect(conditional["test2"]).toNotEqual(true);
        expect(conditional["test3"]).toNotEqual(true);
    });
});
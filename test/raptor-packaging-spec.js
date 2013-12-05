require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('packaging module', function() {

    var Dependency_module = require('raptor/packaging/Dependency_module'),
        Dependency_i18n = require('raptor/packaging/Dependency_i18n');

    it('should handle simple string without file extension', function() {
        var PackageManifest = require('raptor/packaging/PackageManifest'),
            dependencyConfig = 'some/module',
            dependency = PackageManifest.createDependency(dependencyConfig);

        expect(dependency.constructor).toEqual(Dependency_module);
        expect(dependency.type).toEqual('module');
        expect(dependency.name).toEqual('some/module');
    });

    it('should handle dependency config with module property but no type', function() {
        var PackageManifest = require('raptor/packaging/PackageManifest'),
            dependencyConfig = {"module": "some/module"},
            dependency = PackageManifest.createDependency(dependencyConfig);

        expect(dependency.constructor).toEqual(Dependency_module);
        expect(dependency.type).toEqual('module');
        expect(dependency.name).toEqual('some/module');
    });

    it('should handle dependency config with type and name', function() {
        var PackageManifest = require('raptor/packaging/PackageManifest'),
            dependencyConfig = {"type": "module", "name": "some/module"},
            dependency = PackageManifest.createDependency(dependencyConfig);

        expect(dependency.constructor).toEqual(Dependency_module);
        expect(dependency.type).toEqual('module');
        expect(dependency.name).toEqual('some/module');
    });

    it('should handle dependency that is simple string and infer type from file extension', function() {
        var PackageManifest = require('raptor/packaging/PackageManifest'),
            dependencyConfig = 'SomeThing.i18n.json',
            dependency = PackageManifest.createDependency(dependencyConfig);

        expect(dependency.constructor).toEqual(Dependency_i18n);
        expect(dependency.type).toEqual('i18n');
        expect(dependency.path).toEqual('SomeThing.i18n.json');
    });

    it('should handle dependency whose type is explicit', function() {
        var PackageManifest = require('raptor/packaging/PackageManifest'),
            dependencyConfig = {"type": "i18n", "path": "SomeThing.i18n.json"},
            dependency = PackageManifest.createDependency(dependencyConfig);

        expect(dependency.constructor).toEqual(Dependency_i18n);
        expect(dependency.type).toEqual('i18n');
        expect(dependency.path).toEqual('SomeThing.i18n.json');
    });

    it('should allow recursively walking dependency graph via DependencyWalker', function(done) {
        var DependencyWalker = require('raptor/packaging/DependencyWalker'),
            packaging = require('raptor/packaging'),
            expected = ['packaging/module1', 'SomeFile1.js', 'packaging/module2', 'SomeFile2.js', 'packaging/module3', 'SomeFile3.js', 'SomeFile_jquery.css'],
            actual = [];

        var walker = new DependencyWalker();

        walker
            .enableExtensions(['jquery'])

            // our callback will be called for each unique manifest that is encountered
            .onManifest(function(manifest, fromDependency) {
                actual.push(manifest.name);
            })

            // our callback will be called for EVERY dependency
            .onDependency(function(dependency, extension) {
                if (this.hasManifest(dependency)) {
                    // dependency represents a package or module so recurse into it
                    this.walkManifest(dependency);
                } else {
                    // dependency represents a simple dependency (a leaf node)
                    actual.push(dependency.path);
                }
            })

            .onComplete(function() {
                expect(expected).toEqual(actual);
                done();
            })

            .onError(function(err) {
                throw err;
            })

            //.walkPackage('packaging/module1-package.json')
            .walkModule('packaging/module1')

            .start();
    });

});
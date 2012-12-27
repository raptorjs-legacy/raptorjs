require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('resources module', function() {

    it('should allow for resolving relative paths', function() {
        var resources = require("raptor/resources"),
            files = require('raptor/files');
        
        var DirSearchPathEntry = require('raptor/resources/DirSearchPathEntry');
        
        var searchPathEntry = new DirSearchPathEntry(files.joinPaths(__dirname, 'resources'));
        var resourceA = resources.findResource('/resource-search-path/a.txt', searchPathEntry);
        var resourceB = resourceA.resolve('b.txt');
        var resourceMissing = resourceA.resolve('missing.txt');
        
        expect(resourceA.readAsString()).toEqual("a");
        expect(resourceB.readAsString()).toEqual("b");
        expect(resourceMissing.exists()).toEqual(false);
        
        expect(resourceA.getParent().resolve('b.txt').readAsString()).toEqual("b");
        expect(resourceA.getParent().resolve('../resource-search-path/b.txt').readAsString()).toEqual("b");
        expect(resourceA.getParent().getParent().resolve('resource-search-path/b.txt').readAsString()).toEqual("b");
    });
});
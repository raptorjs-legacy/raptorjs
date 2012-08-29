require('./_helper.js');

describe('resources module', function() {

    it('should allow for resolving relative paths', function() {
        var resources = raptor.require("resources"),
            files = raptor.require('files');
        
        var DirSearchPathEntry = raptor.require('resources.DirSearchPathEntry');
        
        var searchPathEntry = new DirSearchPathEntry(files.joinPaths(__dirname, 'resources'));
        var resourceA = resources.findResource('/resource-search-path/a.txt', searchPathEntry);
        var resourceB = resourceA.resolve('b.txt');
        var resourceMissing = resourceA.resolve('missing.txt');
        
        expect(resourceA.readFully()).toEqual("a");
        expect(resourceB.readFully()).toEqual("b");
        expect(resourceMissing.exists()).toEqual(false);
        
        expect(resourceA.getParent().resolve('b.txt').readFully()).toEqual("b");
        expect(resourceA.getParent().resolve('../resource-search-path/b.txt').readFully()).toEqual("b");
        expect(resourceA.getParent().getParent().resolve('resource-search-path/b.txt').readFully()).toEqual("b");
    });
});
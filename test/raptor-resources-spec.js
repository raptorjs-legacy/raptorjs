require('./_helper.js');

describe('resources module', function() {

    it('should resolving relative paths', function() {
        var resources = raptor.require("resources");
        expect(resources.resolvePath('/a/b/c', '../test.js')).toEqual('/a/b/test.js');
    });
});
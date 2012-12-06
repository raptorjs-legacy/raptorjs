require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var File = require('raptor/files/File');

describe('files spec', function() {
    
    it("should allow for reading files", function() {
        var file = new File(__dirname, 'resources/files/a.txt');
        var a = file.readAsString();
        expect(a).toEqual('a');
    });
});
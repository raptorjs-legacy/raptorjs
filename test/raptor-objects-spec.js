require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('object spec', function() {
    
    it("should allow for extending files", function() {
        var objects = require('raptor/objects');
        var a = {a: 'a'};
        var b = objects.extend(a, {b: 'b'});

        expect(b.a).toEqual('a');
        expect(b.b).toEqual('b');
    });
});
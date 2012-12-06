require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('regexp module', function() {

    it('should support escaping', function() {
        var regexp = require('raptor/regexp');
        expect(regexp.escape("hello{world}")).toEqual("hello\\{world\\}");
    });
    
    it('should support simple regular expressions', function() {
        var regexp = require('raptor/regexp');
        
        //console.log("test?.txt", regexp.simple("test?.txt"));
        expect(regexp.simple("test*.txt").test("test12.txt")).toEqual(true);
        expect(regexp.simple("test*.txt").test("test1.txt")).toEqual(true);
        expect(regexp.simple("test?.txt").test("test12.txt")).toEqual(false);
        expect(regexp.simple("test?.txt").test("test1.txt")).toEqual(true);
        expect(regexp.simple("test*.txt{test}").test("test1.txt{test}")).toEqual(true);
    });

});
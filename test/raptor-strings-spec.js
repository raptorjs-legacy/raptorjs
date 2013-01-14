require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

describe('strings module', function() {

    it('should support isEmpty', function() {
        var strings = require('raptor/strings');
        expect(strings.isEmpty("   ")).toEqual(true);
    });
    
    it('should support a StringBuilder', function() {
        var strings = require('raptor/strings');
        expect(strings.StringBuilder).toNotEqual(null);
    });
    
    it('should support merging strings with dynamic data', function() {
        var strings = require('raptor/strings');
        expect(strings.merge("Hello ${name}", {name: "World"})).toEqual("Hello World");
        expect(strings.merge("Hello ${name}!", {name: "World"})).toEqual("Hello World!");
        expect(strings.merge("${name}", {name: "World"})).toEqual("World");
    });

    it('should support startsWith and endsWith', function() {
        var str = "Hello World";
        expect(str.startsWith("Hello")).toEqual(true);
        expect(str.startsWith("FALSE")).toEqual(false);
        expect(str.startsWith("Hello World")).toEqual(true);
        expect(str.startsWith("Hello World!")).toEqual(false);
        expect(str.startsWith("H")).toEqual(true);
        expect(str.startsWith("ello", 1)).toEqual(true);

        expect(str.endsWith("World")).toEqual(true);
        expect(str.endsWith("FALSE")).toEqual(false);
        expect(str.endsWith("Hello World")).toEqual(true);
        expect(str.endsWith("Hello World!")).toEqual(false);
        expect(str.endsWith("d")).toEqual(true);
        expect(str.endsWith("ello World", 1)).toEqual(true);
    });

});
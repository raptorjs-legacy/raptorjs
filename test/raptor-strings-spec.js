require('./_helper.js');

describe('strings module', function() {

    it('should support isEmpty', function() {
        var strings = raptor.require("strings");
        expect(strings.isEmpty("   ")).toEqual(true);
    });
    
	it('should support a StringBuilder', function() {
		var strings = raptor.require("strings");
		expect(strings.StringBuilder).toNotEqual(null);
	});
	
	it('should support merging strings with dynamic data', function() {
		var strings = raptor.require("strings");
		expect(strings.merge("Hello ${name}", {name: "World"})).toEqual("Hello World");
		expect(strings.merge("Hello ${name}!", {name: "World"})).toEqual("Hello World!");
		expect(strings.merge("${name}", {name: "World"})).toEqual("World");
	});

});
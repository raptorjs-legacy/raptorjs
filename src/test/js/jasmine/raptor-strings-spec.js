describe('strings module', function() {

    it('should support isEmpty', function() {
        var strings = raptor.require("strings");
        expect(strings.isEmpty("   ")).toEqual(true);
    });
    
	it('should support a StringBuilder', function() {
		var strings = raptor.require("strings");
		expect(strings.StringBuilder).toNotEqual(null);
	});

});
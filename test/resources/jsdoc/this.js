/**
 * Simple module with anonymous class
 */
raptor.define("Simple", function(raptor) {
    var Simple = function() {
    	/**
    	 * Test property a
    	 */
    	this.a = true;
    };
    
    Simple.prototype = {
		test: function() {
			this.b = "Hello";
		}
    };
    
    Simple.prototype.test = function() {
    	this.c = "Hello";
    };
    
    return Simple;
});
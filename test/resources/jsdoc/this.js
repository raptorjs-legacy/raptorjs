/**
 * Simple module with anonymous class
 */
define("Simple", function(require) {
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
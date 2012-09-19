/**
 * Simple module with anonymous class
 */
raptor.define("simple", function(raptor) {
    
    /**
     * Anonymous inner class
     * 
     */
    var Anon = function(a, b, c) {
        
    };
    
    Anon.prototype = {
        /**
         * 
         * @param a
         * @param b
         */
        myAnonFunction: function(a, b) {
            
        }
    };
    
    
    while (true) {
    	/**
         * Test dynamic prototype property
         */
    	Anon.prototype.testDyna = function() {
        	
        }	
    }
    
    
    return {
        hello: function() {
            
        },
        
        /**
         * A reference to the anonymous inner class
         */
        anonMember: Anon
    };
});
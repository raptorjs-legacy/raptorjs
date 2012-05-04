/**
	@name Object
	@class Additions to the core Object prototype.
*/

/** @author Patrick Steele-Idem, released as public domain. */
Object.prototype.keys = function() {
    var keys = [];
    
	for (var k in this) {
	    if (this.hasOwnProperty(k)) {
	        keys.push(k);
	    }
	}
	return keys;
};
if (typeof JSDOC == "undefined") JSDOC = {};

/**
	@constructor
*/
JSDOC.TokenStream = function(tokens) {
	this.tokens = (tokens || []);
	this.rewind();
}

/**
	@constructor
	@private
*/
function VoidToken(/**String*/type) {
	this.toString = function() {return "<VOID type=\""+type+"\">"};
	this.is = function(){return false;}
}

JSDOC.TokenStream.prototype.rewind = function() {
	this.cursor = -1;
}

/**
	@type JSDOC.Token
*/
JSDOC.TokenStream.prototype.look = function(/**Number*/n, /**Boolean*/considerWhitespace, skipComments) {
	if (typeof n == "undefined") n = 0;

	if (considerWhitespace == true) {
		if (this.cursor+n < 0 || this.cursor+n > this.tokens.length) return {};
		return this.tokens[this.cursor+n];
	}
	else {
		var count = 0;
		var i = this.cursor;

		while (true) {
			if (i < 0) return new JSDOC.Token("", "VOID", "START_OF_STREAM");
			else if (i > this.tokens.length) return new JSDOC.Token("", "VOID", "END_OF_STREAM");

			if (i != this.cursor && (this.tokens[i] === undefined || this.tokens[i].is("WHIT") || this.tokens[i].is("COMM"))) {
				if (n < 0) i--; else i++;
				continue;
			}
			
			if (count == Math.abs(n)) {
				return this.tokens[i];
			}
			count++;
			(n < 0)? i-- : i++;
		}

		return new JSDOC.Token("", "VOID", "STREAM_ERROR"); // because null isn't an object and caller always expects an object
	}
}

JSDOC.TokenStream.prototype.lookSkipComments = function(/**Number*/n) {
    return this.look(n, false, true);
}

/**
	@type JSDOC.Token|JSDOC.Token[]
*/
JSDOC.TokenStream.prototype.next = function(/**Number*/howMany) {
    if (typeof howMany == "undefined") howMany = 1;
    
    if (howMany === 0) return this.look();
    
    var reverse = howMany < 0;
    howMany = Math.abs(howMany);
    
	
	if (howMany < 1) return null;
	var got = [];

	for (var i = 1; i <= howMany; i++) {
	    if (reverse) {
	        if (this.cursor === 0) {
	            break;
	        }
	        else {
	            this.cursor--;
	        }
	    }
	    else {
	        if (this.cursor + 1 >= this.tokens.length) {
	            break;
	        }
	        else {
	            this.cursor++;
	        }
	    }
		
		got.push(this.tokens[this.cursor]);
	}
	
	if (got.length === 0) {
	    return null;
	}

	if (howMany == 1) {
		return got[0];
	}
	else return got;
}

JSDOC.TokenStream.prototype.prev = function(/**Number*/howMany) {
    return this.next(typeof howMany === 'number' ? 0 - howMany : -1);
}

/**
	@type JSDOC.Token[]
*/
JSDOC.TokenStream.prototype.balance = function(/**String*/start, /**String*/stop) {
	if (!stop) stop = JSDOC.Lang.matching(start);
	
	var depth = 0;
	var got = [];
	var started = false;
	
	while ((token = this.look())) {
		if (token.is(start)) {
			depth++;
			started = true;
		}
		
		if (started) {
			got.push(token);
		}
		
		if (token.is(stop)) {
			depth--;
			if (depth == 0) return got;
		}
		if (!this.next()) break;
	}
}

JSDOC.TokenStream.prototype.getMatchingToken = function(/**String*/start, /**String*/stop) {
	var depth = 0;
	var cursor = this.cursor;
	
	if (!start) {
		start = JSDOC.Lang.matching(stop);
		depth = 1;
	}
	if (!stop) stop = JSDOC.Lang.matching(start);
	
	while ((token = this.tokens[cursor])) {
		if (token.is(start)) {
			depth++;
		}
		
		if (token.is(stop) && cursor) {
			depth--;
			if (depth == 0) return this.tokens[cursor];
		}
		cursor++;
	}
}

JSDOC.TokenStream.prototype.insertAhead = function(/**JSDOC.Token*/token, delta) {
    if (arguments.length == 1) {
        delta = 1;
    }
    
	this.tokens.splice(this.cursor+delta, 0, token);
	
	//Keep the cursor so it points at the same token
	if (delta < 1) {
	    this.cursor++;
	}
}


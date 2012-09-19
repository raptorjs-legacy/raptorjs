require('./_helper.js');

var File = raptor.require('files').File,
    dir = new File(__dirname),
    logger = raptor.require('logging').logger("raptor-jsdocs-spec"),
    createEnv = function() {
		var jsdocs = raptor.require('jsdocs');
		var symbols = jsdocs.createSymbols();
	    var env = jsdocs.createEnvironment(symbols);
	    raptor.require('jsdocs.raptor-plugin').load(env);
	    return env;
	},
    loadSymbols = function(path) {
	    var File = raptor.require('files').File;
	    
        try
        {
            var jsdocs = raptor.require('jsdocs');
            var env = createEnv();
            
            var ast = jsdocs.parse(new File(dir, path), env);
            
            //console.log('AST for "' + path + '":\n', raptor.require('debug').prettyPrint(ast));
            
            var symbols = jsdocs.loadSymbols(ast, env);
            
            console.log('\n-------------------------------------------------\nSymbols for "' + path + '":\n' + symbols.toString());
            
            return symbols;
        }
        catch(e) {
            logger.error(e);
            throw raptor.createError(new Error('Unable to load symbols at path "' + path + '". Exception: ' + e.toString()), e);
        }
    },
    parseComment = function(path) {
        var File = raptor.require('files').File;
        
    	try {
    		var CommentParser = raptor.require('jsdocs.CommentParser');
        	var env = createEnv();
        	var parser = new CommentParser(env);
        	var comment = parser.parse(new File(dir, path).readFully());
        	return comment;	
    	}
    	catch(e) {
    		logger.error(e);
            throw raptor.createError(new Error('Unable to parse comment at path "' + path + '". Exception: ' + e), e);
    	}
    }; 
    
/*
 * Name reference format
 * 
 * test.MyClass.prototype#hello
 * 
 * 
 * 
 */
    
describe('strings module', function() {

    
    it('should allow for simple modules', function() {
        
        var symbols = loadSymbols("resources/jsdocs/raptor-module-simple.js");
        
    });
    
    it('should allow for simple classes created by returning an object', function() {
        
        var symbols = loadSymbols("resources/jsdocs/raptor-class-object.js");
        expect(symbols.hasSymbol("Simple")).toEqual(true);
        expect(symbols.getSymbol("Simple").getPropertyType('prototype').hasProperty('hello')).toEqual(true);
        
    });
    
    it('should allow for simple classes created using local variables', function() {
        
        var symbols = loadSymbols("resources/jsdocs/raptor-class-var.js");
        expect(symbols.hasSymbol("Simple")).toEqual(true);
        expect(symbols.getSymbol("Simple").getPropertyType('prototype').hasProperty('hello')).toEqual(true);
        
    });
    
    it('should allow for non-Raptor anonymous classes', function() {
        
        var symbols = loadSymbols("resources/jsdocs/anon-class-non-raptor.js");
        expect(symbols.hasSymbol("global")).toEqual(true);
        expect(symbols.hasSymbol("simple-Anon")).toEqual(true);
        expect(symbols.hasSymbol("simple")).toEqual(true);
        expect(symbols.getCount()).toEqual(3);
    });
    
    it('should allow for tags to register new symbols', function() {
        
        var symbols = loadSymbols("resources/jsdocs/tags.js");
        expect(symbols.hasSymbol("mySymbol")).toEqual(true);
        expect(symbols.getSymbol("mySymbol").hasComment()).toEqual(true);
        expect(symbols.getSymbol("mySymbol").getComment().hasTag("name")).toEqual(true);
    });
    
    it('should allow for instance properties', function() {
        
        var symbols = loadSymbols("resources/jsdocs/this.js");
        expect(symbols.getSymbol("Simple").getInstanceType().getProperty("a")).toNotEqual(null);
        
        
        expect(symbols.getSymbol("Simple")
    			.getPropertyType("prototype")).toNotEqual(null);
        
        expect(symbols.getSymbol("Simple")
    			.getPropertyType("prototype")
    			.getPropertyType("test")
    			.getInstanceType()
    			.getPropertyType("b")).toNotEqual(null);
    });
    
    it('should allow comments to be parsed', function() {
    	var comment = parseComment('resources/jsdocs/comment-simple.js');
    	expect(comment.hasTag('test')).toEqual(true);
    	expect(comment.getTag('test').getValue()).toEqual('test');
    	
    	expect(comment.getTag('anotherTag').getValue()).toEqual('line1\nline2\nline3');
    	
    	expect(comment.hasTag('novalue')).toEqual(true);
    	expect(comment.getTag('novalue').getValue()).toStrictlyEqual('');
    	
    	expect(comment.hasTag('novalue2')).toEqual(true);
    	expect(comment.getTag('novalue2').getValue()).toStrictlyEqual('');
    	
    	expect(comment.getDescription()).toEqual('Hello');
    })
    

});
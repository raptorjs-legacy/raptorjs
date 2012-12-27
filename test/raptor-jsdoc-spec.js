require('./_helper.js');

var raptor = require('raptor');
var define = raptor.createDefine(module);

var File = require('raptor/files/File'),
    dir = new File(__dirname),
    logger = require('raptor/logging').logger("raptor-jsdoc-spec"),
    createEnv = function() {
		var jsdoc = require('raptor/jsdoc');
		var symbols = jsdoc.createSymbols();
	    var env = jsdoc.createEnvironment(symbols);
	    require('raptor/jsdoc/raptor-plugin').load(env);
	    return env;
	},
    loadSymbols = function(path) {
	    var File = require('raptor/files/File');
	    
        try
        {
            var jsdoc = require('raptor/jsdoc');
            var env = createEnv();
            
            var ast = jsdoc.parse(new File(dir, path), env);
            
            //console.log('AST for "' + path + '":\n', require('raptor/debug').prettyPrint(ast));
            
            var symbols = jsdoc.loadSymbols(ast, env);
            
            console.log('\n-------------------------------------------------\nSymbols for "' + path + '":\n' + symbols.toString());
            
            return symbols;
        }
        catch(e) {
            logger.error(e);
            throw raptor.createError(new Error('Unable to load symbols at path "' + path + '". Exception: ' + e.toString()), e);
        }
    },
    parseComment = function(path) {
        var File = require('raptor/files/File');
        
    	try {
    		var CommentParser = require('raptor/jsdoc/CommentParser');
        	var env = createEnv();
        	var parser = new CommentParser(env);
        	var comment = parser.parse(new File(dir, path).readAsString());
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
    
xdescribe('jsdoc module', function() {

    
    it('should allow for simple modules', function() {
        
        var symbols = loadSymbols("resources/jsdoc/raptor-module-simple.js");
        
    });
    
    it('should allow for simple classes created by returning an object', function() {
        
        var symbols = loadSymbols("resources/jsdoc/raptor-class-object.js");
        expect(symbols.hasSymbol("Simple")).toEqual(true);
        expect(symbols.getSymbolType("Simple").getPropertyType('prototype').hasProperty('hello')).toEqual(true);
        
    });
    
    it('should allow for simple classes created using local variables', function() {
        
        var symbols = loadSymbols("resources/jsdoc/raptor-class-var.js");
        expect(symbols.hasSymbol("Simple")).toEqual(true);
        expect(symbols.getSymbolType("Simple").getPropertyType('prototype').hasProperty('hello')).toEqual(true);
        
    });
    
    it('should allow for non-Raptor anonymous classes', function() {
        
        var symbols = loadSymbols("resources/jsdoc/anon-class-non-raptor.js");
        expect(symbols.hasSymbol("global")).toEqual(true);
        expect(symbols.hasSymbol("simple.Anon")).toEqual(true);
        expect(symbols.hasSymbol("simple")).toEqual(true);
        expect(symbols.getCount()).toEqual(3);
    });
    
    it('should allow for tags to register new symbols', function() {
        
        var symbols = loadSymbols("resources/jsdoc/tags.js");
        expect(symbols.hasSymbol("mySymbol")).toEqual(true);
        expect(symbols.getSymbolType("mySymbol").hasComment()).toEqual(true);
        expect(symbols.getSymbolType("mySymbol").getComment().hasTag("name")).toEqual(true);
    });
    
    it('should allow for instance properties', function() {
        
        var symbols = loadSymbols("resources/jsdoc/this.js");
        expect(symbols.getSymbolType("Simple").getInstanceType().getProperty("a")).toNotEqual(null);
        
        
        expect(symbols.getSymbolType("Simple")
    			.getPropertyType("prototype")).toNotEqual(null);
        
        expect(symbols.getSymbolType("Simple")
    			.getPropertyType("prototype")
    			.getPropertyType("test")
    			.getInstanceType()
    			.getPropertyType("b")).toNotEqual(null);
    });
    
    it('should allow comments to be parsed', function() {
    	var comment = parseComment('resources/jsdoc/comment-simple.js');
    	expect(comment.hasTag('test')).toEqual(true);
    	expect(comment.getTag('test').getValue()).toEqual('test');
    	
    	expect(comment.getTag('anotherTag').getValue()).toEqual('line1 line2 line3');
    	
    	expect(comment.hasTag('novalue')).toEqual(true);
    	expect(comment.getTag('novalue').getValue()).toStrictlyEqual('');
    	
    	expect(comment.hasTag('novalue2')).toEqual(true);
    	expect(comment.getTag('novalue2').getValue()).toStrictlyEqual('');
    	
    	expect(comment.getDescription()).toEqual('Hello');
    });
    
    it('should allow complex comments to be parsed', function() {
        var comment = parseComment('resources/jsdoc/comment-complex.js');
        expect(comment.getTags("param").length).toEqual(3);
        expect(comment.getTags("return").length).toEqual(1);
        expect(comment.getTags("param")[2].getValue()).toEqual("factory A factory function that returns either the class constructory function (with prototype) or just the prototype");
        expect(comment.getDescription()).toEqual("Defines a class. This is identical to identical to \"define\" except that it supports a short-hand notation for classes\n\nMultiple signatures supported:\n<ul>\n<li>defineClass(name, modifiers, factory)\n<li>defineClass(name, superclassName, factory)\n<li>defineClass(name, factory)\n<li>defineClass(modifiers, factory)\n<li>defineClass(factory)\n</ul>\n\nSupported modifiers:\n<ul>\n<li>superclass: The name of the super class\n<li>mixins: An array of names of mixins\n</ul>\n\nIn addition, the \"modifiers\" parameter can be a string that specifies the name of the superclass\n\n<h2>Examples: Class with prototype</h2>\n<js>\ndefine.Class(\n    'some.namespace.MyClass',\n    function() {\n        return {\n            init: function() {\n                //Constructor \n            },\n            \n            //Prototype methods:\n            someMethod: function() { ... }\n        }\n    });\n</js>");
    });
    

});
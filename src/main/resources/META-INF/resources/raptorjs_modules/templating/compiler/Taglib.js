raptor.defineClass(
    'templating.compiler.Taglib',
    function(raptor) {
        
        var forEach = raptor.forEach,
            errors = raptor.errors;
        
        
        var Taglib = function() {
//            this.uri = null;
//            this.shortName = null;
//            this.tags = [];
//            this.textTransformers = [];
        };
        
        Taglib.prototype = {
            
        };
        
        Taglib.Tag = raptor.defineClass(function() {
            var Tag = function() {
//                this.name = null;
//                this.uri = null;
//                this.handlerClass = null;
//                this.dynamicAttributes = false;
//                
//                this.attributeMap = {};
//                this.transformers = [];
//                this.nestedVariables = [];
//                this.importedVariables = [];
            };
            
            Tag.prototype = {
                getAttributeDef: function(uri, localName) {
                    if (uri == null) {
                        uri = '';
                    }
                    return this.attributeMap[uri + ':' + localName] || this.attributeMap[uri + ':*'] || this.attributeMap['*:*'];
                },
                
                toString: function() {
                    return "[Tag: <" + this.uri + ":" + this.name + ">]";  
                }
            };
            
            return Tag;
        });
        
        Taglib.Transformer = raptor.defineClass(function() {
            var uniqueId = 0;
            
            var Transformer = function() {
                this.id = uniqueId++; 
                this.tag = null;
                this.className = null;
                this.instance = null;
            };
            
            Transformer.prototype = {
                getInstance: function() {
                    if (!this.className) {
                        errors.throwError(new Error("Transformer class not defined for tag transformer (tag=" + this.tag + ")"));
                    }
                    
                    if (!this.instance) {
                        var Clazz = raptor.require(this.className);
                        this.instance = new Clazz();
                        this.instance.id = this.id;
                    }
                    return this.instance;
                },
                
                toString: function() {
                    return '[Taglib.Transformer: ' + this.className + ']';
                }
            
            };
            
            return Transformer;
        });
        
        return Taglib;
    });
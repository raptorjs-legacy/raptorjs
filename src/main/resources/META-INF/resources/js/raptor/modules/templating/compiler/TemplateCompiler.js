raptor.defineClass(
    'templating.compiler.TemplateCompiler',
    function(raptor) {
        
        var TemplateBuilder = raptor.require('templating.compiler.TemplateBuilder'),
            ParseTreeBuilder = raptor.require('templating.compiler.ParseTreeBuilder'),
            ElementNode = raptor.require('templating.compiler.ElementNode'),
            Expression = raptor.require('templating.compiler.Expression'),
            TextNode = raptor.require('templating.compiler.TextNode'),
            forEach = raptor.forEach,
            errors = raptor.require("errors");
        
        var TemplateCompiler = function(taglibs, options) {
            this.taglibs = taglibs;
            this.options = options;
        };
        
        TemplateCompiler.prototype = {
                

            transformTree: function(node, templateBuilder) {
                var pos,
                    posString;
                
                
                
                if (node instanceof ElementNode) {
                    
                    try
                    {
                        this.taglibs.forEachTagTransformer(
                            node.uri, 
                            node.localName,
                            function(transformer) {
                                if (!node.isTransformerApplied(transformer)) {
                                    node.setTransformerApplied(transformer);
                                    this._transformerApplied = true;
                                    transformer.getInstance().process(node, this, templateBuilder);
                                }
                            },
                            this);
                    }
                    catch(e) {
                        pos = node.pos;
                        posString = pos ? (pos.filePath + ":" + pos.line + ":" + pos.column) : "(unknown)";
                        errors.throwError(new Error("Unable to compile element at position [" + posString + "]. Error: " + e.message), e);
                    }
                }
                else if (node instanceof TextNode) {
                    try
                    {
                        this.taglibs.forEachTextTransformer(
                            function(transformer) {
                                
                                if (!node.isTransformerApplied(transformer)) {
                                    
                                    node.setTransformerApplied(transformer);
                                    this._transformerApplied = true;
                                    transformer.getInstance().process(node, this, templateBuilder);
                                }
                            },
                            this);
                    }
                    catch(textException) {
                        pos = node.pos;
                        posString = pos ? (pos.filePath + ":" + pos.line + ":" + pos.column) : "(unknown)";
                        errors.throwError(new Error("Unable to compile text at position [" + posString + "]. Error: " + textException.message), textException);
                    }
                }
                
                for (var i=0; i<node.childNodes.length; i++) {
                    var childNode = node.childNodes[i];
                    if (childNode.parentNode) {
                        this.transformTree(childNode, templateBuilder);
                    }
                }
            },

            compile: function(src, filePath) {
                try
                {
                    //First build the parse tree for the tempate
                    var rootNode = ParseTreeBuilder.parse(src, filePath);
                    
                    var templateBuilder = new TemplateBuilder(this);                    
                    
                    //Then transform the tree by applying all of the compilers to the tree
                    
                    //console.error("TRANSFORM TREE - BEFORE");
                    do
                    {
                        //console.error("TRANSFORM TREE");
                        this._transformerApplied = false;
                        this.transformTree(rootNode, templateBuilder);                        
                    }
                    while (this._transformerApplied);
                    //console.error("TRANSFORM TREE - AFTER");
                    
                    //Then generate the JavaScript code against the transformed tree
                    
                    rootNode.generateCode(templateBuilder);
                    
                    var output = templateBuilder.getOutput();
                    
                    //console.log('COMPILED TEMPLATE (' + filePath + ')\n', '\n' + output, '\n------------------');
                    return output;
                }
                catch(e) {
                    var message = 'Unable to compile template at path "' + filePath + '". Exception: ' + e;
//                    if (this.options.logErrors !== false) {
//                        this.logger().error(message, e);
//                    }
                    errors.throwError(new Error(message), e);
                }
            },
            
            compileAndLoad: function(src, filePath) {
                var compiledSrc = this.compile(src, filePath);
                
                raptor.require("templating");
                
                try
                {
                    eval(compiledSrc);
                }
                catch(e) {
                    errors.throwError(new Error('Unable to load template at path "' + filePath + '". Exception: ' + e.message), e);
                }
            },
            
            handleNodeError: function(message, node) {
                var pos = node.pos;
                errors.throwError(new Error(message + " (" + (pos ? (pos.filePath + ":" + pos.line + ":" + pos.column) : "unknown position") + ")"));
            },
            
            isExpression: function(expression) {
                return expression instanceof Expression;
            }
        };
        
        return TemplateCompiler;
    });
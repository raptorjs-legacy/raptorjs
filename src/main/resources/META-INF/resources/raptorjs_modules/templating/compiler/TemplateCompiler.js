raptor.defineClass(
    'templating.compiler.TemplateCompiler',
    function(raptor) {
        
        var TemplateBuilder = raptor.require('templating.compiler.TemplateBuilder'),
            ParseTreeBuilder = raptor.require('templating.compiler.ParseTreeBuilder'),
            Expression = raptor.require('templating.compiler.Expression'),
            forEach = raptor.forEach,
            errors = raptor.require("errors");
        
        /**
         * @param taglibs {templating.compiler$TaglibCollection} The collection of taglibs that are available to the compiler
         * @param options {object} The options for the compiler.
         */
        var TemplateCompiler = function(taglibs, options) {
            this.taglibs = taglibs;
            this.options = options;
        };
        
        TemplateCompiler.prototype = {
                
            /**
             * This method processes every node in the tree using a pre-order traversal.
             * That is, the parent node is transformed before its child nodes are
             * transformed.
             * 
             * <p>
             * NOTE: 
             * This method is repeatedly called until there are no more nodes in the tree
             * that need to be transformed. This is because transformers might add
             * new nodes to the tree in a position that has already been passed and
             * we want to make sure that all new nodes added to the tree are transformed
             * as necessary.
             * 
             * @param node {templating.compiler$Node} The root node to transform
             * @param templateBuilder {templating.compiler$TemplateBuilder} The template builder object that is used to control how the compiled code is generated
             */
            transformTree: function(node, templateBuilder) {
                try
                {
                    this.taglibs.forEachNodeTransformer(
                        node, //The node being transformed 
                        function(transformer) {
                            if (!node.isTransformerApplied(transformer)) { //Check to make sure a transformer of a certain type is only applied once to a node
                                node.setTransformerApplied(transformer); //Mark the node as have been transformed by the current transformer
                                this._transformerApplied = true; //Set the flag to indicate that a node was transformed
                                transformer.getInstance().process(node, this, templateBuilder);
                            }
                        },
                        this);
                }
                catch(e) {
                    errors.throwError(new Error("Unable to compile node " + node + " at position [" + (node.pos || "(unknown)") + "]. Error: " + e.message), e);
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
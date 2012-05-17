raptor.defineClass(
    'templating.compiler.TemplateCompiler',
    function(raptor) {
        
        var TemplateBuilder = raptor.require('templating.compiler.TemplateBuilder'),
            ParseTreeBuilder = raptor.require('templating.compiler.ParseTreeBuilder'),
            Expression = raptor.require('templating.compiler.Expression'),
            forEach = raptor.forEach,
            errors = raptor.require("errors"),
            minifier = raptor.find("js-minifier");
        
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
                    this.taglibs.forEachNodeTransformer( //Handle all of the transformers that are appropriate for this node
                        node, //The node being transformed 
                        function(transformer) {
                            if (!node.isTransformerApplied(transformer)) { //Check to make sure a transformer of a certain type is only applied once to a node
                                node.setTransformerApplied(transformer); //Mark the node as have been transformed by the current transformer
                                this._transformerApplied = true; //Set the flag to indicate that a node was transformed
                                transformer.getInstance().process(node, this, templateBuilder); //Have the transformer process the node (NOTE: Just because a node is being processed by the transformer doesn't mean that it has to modify the parse tree)
                            }
                        },
                        this);
                }
                catch(e) {
                    errors.throwError(new Error("Unable to compile node " + node + " at position [" + (node.pos || "(unknown)") + "]. Error: " + e.message), e);
                }
                
                /*
                 * Now process the child nodes by looping over the child nodes
                 * and transforming the subtree recursively 
                 * 
                 * NOTE: The length of the childNodes array might change as the tree is being performed.
                 *       The checks to prevent transformers from being applied multiple times makes
                 *       sure that this is not a problem.
                 */
                for (var i=0; i<node.childNodes.length; i++) {
                    var childNode = node.childNodes[i];
                    if (!childNode.parentNode) {
                        //Validate that the parentNode property is set correctly for this child node
                        raptor.throwError(new Error("Invalid node found in tree. parentNode property of child node is not set. Node: " + node));
                    }
                    this.transformTree(childNode, templateBuilder);
                }
            },

            /**
             * Compiles the XML source code for a template and returns the resulting compiled JavaScript code.
             * 
             * <p>
             * When the returned code is evaluated by a JavaScript engine it will register the function
             * to render the template. The function is registered with the name found as the "name" attribute
             * of the root &ltc:template> element unless a template name is passed in as a compiler option.
             * 
             * 
             * @param xmlSrc {String} The XML source code for the template
             * @param filePath {String} The path to the input template for debugging/error reporting only
             * @returns {String} The JavaScript code for the compiled template
             */
            compile: function(xmlSrc, filePath) {
                try
                {
                    /*
                     * First build the parse tree for the tempate
                     */
                    var rootNode = ParseTreeBuilder.parse(xmlSrc, filePath, this.taglibs); //Build a parse tree from the input XML
                    
                    var templateBuilder = new TemplateBuilder(this); //The templateBuilder object is need to manage the compiled JavaScript output              

                    /*
                     * The tree is continuously transformed until we go through an entire pass where 
                     * there were no new nodes that needed to be transformed. This loop makes sure that
                     * nodes added by transformers are also transformed.
                     */
                    do
                    {
                        this._transformerApplied = false; //Reset the flag to indicate that no transforms were yet applied to any of the nodes for this pass
                        this.transformTree(rootNode, templateBuilder); //Run the transforms on the tree                 
                    }
                    while (this._transformerApplied);
                    
                    /*
                     * The tree has been transformed and we can now generate
                     */
                    rootNode.generateCode(templateBuilder); //Generate the code and have all output be managed by the TemplateBuilder
                    
                    var output = templateBuilder.getOutput(); //Get the compiled output from the template builder
                    if (minifier && this.options.minify !== false) {
                        output = minifier.minify(output);
                    }
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
            
            /**
             * 
             * @param xmlSrc {String} The XML source code for the template
             * @param filePath {String} The path to the input template for debugging/error reporting only
             * @return {void}
             */
            compileAndLoad: function(xmlSrc, filePath) {
                var compiledSrc = this.compile(xmlSrc, filePath); //Get the compiled output for the template
                
                raptor.require("templating"); //Make sure the templating module is loaded before the compiled code is evaluated
                
                try
                {
                    eval(compiledSrc); //Evaluate the compiled code and register the template
                }
                catch(e) {
                    errors.throwError(new Error('Unable to load template at path "' + filePath + '". Exception: ' + e.message), e);
                }
            },
            
            /**
             * 
             * @param message
             * @param node
             */
            handleNodeError: function(message, node) {
                var pos = node.pos;
                errors.throwError(new Error(message + " (" + (pos ? (pos.filePath + ":" + pos.line + ":" + pos.column) : "unknown position") + ")"));
            },
            
            /**
             * Returns true if the provided object is an Expression object, false otherwise
             * @param expression {Object} The object to test
             * @returns {Boolean} True if the provided object is an Expression object, false otherwise
             */
            isExpression: function(expression) {
                return expression instanceof Expression;
            }
        };
        
        return TemplateCompiler;
    });
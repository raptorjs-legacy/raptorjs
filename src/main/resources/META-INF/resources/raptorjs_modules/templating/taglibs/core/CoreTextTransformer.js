raptor.defineClass(
    "templating.taglibs.core.CoreTextTransformer",
    function() {
        
        var ExpressionParser = raptor.require('templating.compiler.ExpressionParser'),
            TextNode = raptor.require('templating.compiler.TextNode'),
            WriteNode = raptor.require('templating.taglibs.core.WriteNode'),
            ScriptletNode = raptor.require('templating.taglibs.core.ScriptletNode'),
            strings = raptor.require('strings');
        
        return {
            
            process: function(node, compiler) {
                
                if (node.parentNode && node.parentNode.allowBodyExpressions === false) {
                    return; //Don't try to parse expressions
                }
                
                var parts = [];
                ExpressionParser.parse(
                    node.text, 
                    {
                        text: function(text) {
                            parts.push({text: text});
                        },
                        
                        expression: function(expression) {
                            parts.push({expression: expression});
                        },
                        
                        scriptlet: function(scriptlet) {
                            parts.push({scriptlet: scriptlet});
                        }
                    }, 
                    this);
                
                if (parts.length > 0) {
                    var startIndex = 0;
                    
                    if (parts[0].text) {
                        node.text = parts[0].text; //Update this text node to match first text part and we'll add the remaining
                        startIndex = 1;
                    }
                    else {
                        node.text = ''; //The first part is an expression so we'll just zero out this text node
                        startIndex = 0;
                    }
                    
                    var newNodes = [];
                    
                    for (var i=startIndex; i<parts.length; i++) {
                        
                        var part = parts[i], 
                            newNode = null;
                        
                        
                        if (part.hasOwnProperty('text')) {
                            newNode = new TextNode(part.text);
                            newNode.setTransformerApplied(this); //We shouldn't reprocess the new text node
                        }
                        else if (part.hasOwnProperty('expression')) {
                            newNode = new WriteNode({expression: part.expression, escapeXml: part.expression.escapeXml !== false});
                        }
                        else if (part.hasOwnProperty('scriptlet')) {
                            newNode = new ScriptletNode(part.scriptlet);
                        }
                        
                        if (newNode) {
                            newNodes.push(newNode);
                        }
                    }
                    
                    node.parentNode.insertAfter(newNodes, node);
                }
            }
        };
    });
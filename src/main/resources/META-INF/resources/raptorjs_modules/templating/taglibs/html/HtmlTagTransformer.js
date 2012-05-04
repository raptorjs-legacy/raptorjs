raptor.defineClass(
    "templating.taglibs.html.HtmlTagTransformer",
    function() {

        return {
            
            process: function(node, compiler) {
                
                if (node.isElementNode()) {
                    var options = compiler.options || {};
                    var preserveWhitespace = compiler.options.preserveWhitespace || {};
                    var allowSelfClosing = compiler.options.allowSelfClosing || {};
                    var startTagOnly = compiler.options.startTagOnly || {};
                    
                    var lookupKey = node.uri ? node.uri + ":" + node.localName : node.localName;
                    if (preserveWhitespace[lookupKey] === true) {
                        node.setPreserveSpace(true);
                    }
                    
                    if (allowSelfClosing[lookupKey] === false) {
                        node.setAllowSelfClosing(false);
                    }
                    
                    if (compiler.options.xhtml !== true && startTagOnly[lookupKey] === true) {
                        node.setStartTagOnly(true);
                    }
                }
                
            }
        };
    });
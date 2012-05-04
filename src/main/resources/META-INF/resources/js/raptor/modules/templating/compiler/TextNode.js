raptor.defineClass(
    'templating.compiler.TextNode',
    'templating.compiler.Node',
    function() {
       
        var TextNode = function(text) {
            TextNode.superclass.constructor.call(this, 'text');
            this.text = text;
        };
        
        TextNode.prototype = {
            doGenerateCode: function(template) {
                var text = this.text;
                if (text) {
                    var preserveWhitespace = template.isPreserveWhitespace() ||
                        (template.options.preserveWhitespace === true) ||
                        (template.options.preserveWhitespace && template.options.preserveWhitespace["*"]);
                    
                    if (!preserveWhitespace) {
                        text = this.text.replace(/(^\n\s*|\n\s*$)/g, "").replace(/\s+/g, " ");
                    }

                    template.addText(text);
                }
            },
            
            getText: function() {
                return this.text;
            },
            
            isTextNode: function() {
                return true;
            },
            
            isElementNode: function() {
                return false;
            },
            
            toString: function() {
                return "[text]";
            }
        };
        
        return TextNode;
    });
raptor.define(
    "jsdocs.RaptorSymbol",
    "jsdocs.Symbol",
    function(raptor) {
        "use strict";
        
        var RaptorSymbol = function(name, type, comment) {
            RaptorSymbol.superclass.constructor.apply(this, arguments);
            
            this.modifiers = null;
            this.raptorType = null;
        };
        
        RaptorSymbol.prototype = {
            setModifiers: function(modifiers) {
                this.modifiers = modifiers;
            },
            
            getRaptorTypeName: function() {
                if (!this.raptorType) {
                    var type = this.getType();
                    if (type) {
                        if (type.isJavaScriptFunction()) {
                            this.raptorType = "class";
                        }
                        else {
                            this.raptorType = "module";
                        }
                    }    
                }
                return this.raptorType;
                
            },
            
            setRaptorType: function(raptorType) {
                this.raptorType = raptorType;
            },
            
            toString: function() {
                var type = this.getType(),
                    commentStr = '',
                    comment = this.getComment(),
                    indent = "  ";
                
                if (comment) {
                    commentStr = "\n" + indent + comment.getText().replace(/\n\s*/g,"\n" + indent + " ");
                }
                
                return "[Raptor " + this.getRaptorTypeName() + ": " + JSON.stringify(this.getName()) + " --> " + commentStr + "\n  " + this.getType().toString("  ") + "]";
            }
        };
        
        return RaptorSymbol;
        
        
    });
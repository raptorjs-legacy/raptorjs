raptor.defineClass(
    'templating.taglibs.core.ScriptletNode',
    'templating.compiler.Node',
    function() {
       
        var ScriptletNode = function(code) {
            ScriptletNode.superclass.constructor.call(this, 'scriptlet');
            this.code = code;
        };
        
        ScriptletNode.prototype = {
            doGenerateCode: function(template) {
                if (this.code) {
                    template.addJavaScriptCode(this.code);
                }
            },
            
            
            toString: function() {
                return '{%' + this.code + '%}';
            }
        };
        
        return ScriptletNode;
    });
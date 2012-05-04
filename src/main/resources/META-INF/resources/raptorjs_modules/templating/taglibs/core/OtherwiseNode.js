raptor.defineClass(
    'templating.taglibs.core.OtherwiseNode',
    'templating.compiler.Node',
    function(raptor) {
        var strings = raptor.require("strings");
        
        var ChooseNode = function(props) {
            ChooseNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        ChooseNode.prototype = {
            
            doGenerateCode: function(template) {
                template.addJavaScriptCode(' else {');
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}');
            }
            
        };
        
        return ChooseNode;
    });
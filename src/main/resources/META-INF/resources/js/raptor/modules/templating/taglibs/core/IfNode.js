raptor.defineClass(
    'templating.taglibs.core.IfNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors;
        
        var IfNode = function(props) {
            IfNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        IfNode.prototype = {
            doGenerateCode: function(template) {
                var test = this.getProperty("test");
                
                if (!test) {
                    errors.throwError(new Error('"test" attribute is required'));
                }
                
                template.addJavaScriptCode('if (' + test + '){');
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}');
            }
            
        };
        
        return IfNode;
    });
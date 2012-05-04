raptor.defineClass(
    'templating.taglibs.core.WhenNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors;
        
        var WhenNode = function(props) {
            WhenNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        WhenNode.prototype = {
            
            doGenerateCode: function(template) {
                var test = this.getProperty("test");
                
                if (!test) {
                    errors.throwError(new Error('"test" attribute is required for ' + this.toString() + " tag."));
                }
                if (!this.firstWhen) {
                    template.addJavaScriptCode(' else ');                    
                }
                template.addJavaScriptCode('if (' + test + '){');
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}');
            }
            
        };
        
        return WhenNode;
    });
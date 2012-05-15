raptor.defineClass(
    'templating.taglibs.core.InvokeNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors;
        
        var InvokeNode = function(props) {
            InvokeNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        InvokeNode.prototype = {

            doGenerateCode: function(template) {
                
                var func = this.getProperty("function");
                
                if (!func) {
                    errors.throwError(new Error('"function" attribute is required'));
                }
                
                template.addJavaScriptCode(func + ";");
            }
            
        };
        
        return InvokeNode;
    });
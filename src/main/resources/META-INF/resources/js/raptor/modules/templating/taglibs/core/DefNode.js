raptor.defineClass(
    'templating.taglibs.core.DefNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors;
        
        var DefNode = function(props) {
            DefNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        DefNode.prototype = {

            doGenerateCode: function(template) {
                
                var func = this.getProperty("function");
                
                if (!func) {
                    errors.throwError(new Error('"function" attribute is required'));
                }
                
                template.addJavaScriptCode('function ' + func + '{return ' + template.getStaticHelperFunction("noEscapeXml", "nx") + '(context.captureString(function(){');
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}));}');
            }
            
        };
        
        return DefNode;
    });
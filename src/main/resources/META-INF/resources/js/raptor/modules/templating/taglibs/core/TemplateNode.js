raptor.defineClass(
    "templating.taglibs.core.TemplateNode",
    'templating.compiler.Node',
    function() {
        var extend = raptor.extend,
            errors = raptor.errors;
        
        var TemplateNode = function(props) {
            TemplateNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        TemplateNode.prototype = {
        
            doGenerateCode: function(template) {
                var name = this.getProperty("name"),
                    params = this.getProperty("params");
                
                if (params) {
                    params = params.split(/\s*,\s*/g);
                }
                else {
                    params = null;
                }
                
                if (!name) {
                    raptor.throwError(new Error('The "name" attribute is required for the ' + this.toString() + ' tag.'));
                }
                
                template.setTemplateName(name);
                template.addTemplateParams(params);
                this.generateCodeForChildren(template);
            }
        };
        
        return TemplateNode;
    });
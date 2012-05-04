raptor.defineClass(
    'templating.taglibs.core.IncludeNode',
    'templating.compiler.Node',
    function() {
        var errors = raptor.errors,
            stringify = raptor.require('json.stringify').stringify;
        
        var IncludeNode = function(props) {
            IncludeNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        IncludeNode.prototype = {
            doGenerateCode: function(template) {
                
                var templateName = this.getProperty("template");
                this.removeProperty("template");
                
                if (!templateName) {
                    throw new Error('"template" attribute is required');
                }
                var propParts = [];
                
                this.forEachProperty(function(name, value) {
                    propParts.push(stringify(name) + ": " + value);
                }, this);
                
                var propsStr = template.getContextHelperFunction("include", "i") + "(" + templateName + ",{" + propParts.join(",") + "});";
                template.addJavaScriptCode(propsStr);
            }
            
        };
        
        return IncludeNode;
    });
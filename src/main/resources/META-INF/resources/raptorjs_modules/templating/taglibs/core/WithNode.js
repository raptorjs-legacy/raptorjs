raptor.defineClass(
    'templating.taglibs.core.WithNode',
    'templating.compiler.Node',
    function(raptor) {
        var errors = raptor.errors,
            AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter');
        
        var WithNode = function(props) {
            WithNode.superclass.constructor.call(this);
            if (props) {
                this.setProperties(props);
            }
        };
        
        WithNode.prototype = {
            
            doGenerateCode: function(template) {
                var vars = this.getProperty("vars");
                
                if (!vars) {
                    errors.throwError(new Error('"vars" attribute is required'));
                }
                
                var withVars = AttributeSplitter.parse(
                        vars, 
                        {
                            "*": {
                                type: "expression"
                            }
                        },
                        {
                            ordered: true
                        });
                
                var varDefs = [];
                
                raptor.forEach(withVars, function(withVar) {
                    varDefs.push(withVar.name + (withVar.value ? ("=" + withVar.value) : ""));
                });
                
                
                template.addJavaScriptCode('(function() {');
                template.addJavaScriptCode('var ' + varDefs.join(",") + ";");
                this.generateCodeForChildren(template);
                template.addJavaScriptCode('}());');
            }
            
        };
        
        return WithNode;
    });
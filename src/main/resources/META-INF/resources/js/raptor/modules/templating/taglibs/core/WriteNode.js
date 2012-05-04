raptor.defineClass(
    'templating.taglibs.core.WriteNode',
    'templating.compiler.Node',
    function() {
       
        var WriteNode = function(props) {
            WriteNode.superclass.constructor.call(this, 'write');
            
            if (props) {
                this.setProperties(props);
            }
        };
        
        WriteNode.prototype = {   
                
            doGenerateCode: function(template) {
                var expression = this.getProperty("expression") || this.getProperty("value"),
                    escapeXml = this.getProperty("escapeXml") !== false;
                
                if (expression) {
                    template.addWrite(expression, {escapeXml: escapeXml});
                }
            },
            
            
            toString: function() {
                return '[<c:write expression="' + this.getProperty('expression') + '"]';
            }
        };
        
        return WriteNode;
    });
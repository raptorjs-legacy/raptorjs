/**
 * 
 * @extension Rhino
 * 
 */
raptor.extend('templating', function(raptor) {
    
    var WrappedWriter = function(javaWriter) {
        this.javaWriter = javaWriter;
        this.write = function(o) {
            if (o != null) {
                this.javaWriter.write(o.toString());
            }
        };
    };
    
    
    
    return {
        rhinoRender: function(templateName, data, javaWriter) {
            if (data && typeof data === 'string') {
                data = eval("(" + data + ")");
            }
            
            var context = this.createContext(new WrappedWriter(javaWriter));
            this.render(templateName, data);
        },
        
        rhinoRenderToString: function(templateName, data) {
            if (data && typeof data === 'string') {
                data = eval("(" + data + ")");
            }
            return this.renderToString(templateName, data);
        }
    };
});
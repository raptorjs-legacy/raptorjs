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
        /**
         * Provides a Rhino-compatible render function that bridges the gap between
         * the Java world and the JavaScript world.
         * 
         * @param templateName {java.lang.String} The name of template to render
         * @param data {String|java.lang.Object} The data object to pass to the template rendering function
         * @param javaWriter {java.io.Writer} The Java Writer object to use for output
         * @returns {void}
         */
        rhinoRender: function(templateName, data, javaWriter) {
            if (data && typeof data === 'string') {
                data = eval("(" + data + ")"); //Convert the JSON string to a native JavaScript object
            }
            
            var context = this.createContext(new WrappedWriter(javaWriter)); //Wrap the Java writer with a JavaScript object
            this.render('' + templateName, data);
        },
        
        /**
         * Provides a Rhino-compatible renderToString function that bridges the gap between
         * the Java world and the JavaScript world.
         * 
         * @param templateName {java.lang.String} The name of template to render
         * @param data {String|java.lang.Object} The data object to pass to the template rendering function
         * @returns {String} The resulting String
         */
        rhinoRenderToString: function(templateName, data) {
            if (data && typeof data === 'string') {
                data = eval("(" + data + ")");
            }
            return this.renderToString('' + templateName, data);
        }
    };
});
raptorBuilder.addLoader(function(raptor) {
    var stacktraces = raptor.stacktraces;
    
    raptor.defineCore('errors', {        
        /**
         * 
         * @param message
         * @param cause
         */
        throwError: function(message, cause)
        {
            var output = '';
            
            var stackTrace = stacktraces.trace(message);
            if (stackTrace == null) {
                stackTrace = stacktraces.traceAndTrim(1);
            }
            if (message instanceof Error) {
                output += message + "\nStacktrace:\n" + stackTrace;
            }
            else {
                output += message;
            }
            
            if (cause) {
                output += "\n\nCaused by: ";
                
                if (cause instanceof Error) {
                    output += cause + "\nStacktrace:\n" + stacktraces.trace(cause);
                }
                else {
                    output += cause;
                }
            }
            
            output += "\n";
            
            throw new Error(output);
        }
    });  
    
    raptor.throwError = raptor.errors.throwError;
});
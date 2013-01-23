exports.load = function(raptor) {
    "use strict";
    
    (function() {
        raptor.global = this;
    }());

    
    
    raptor.createError = function(message, cause) {
        var stacktraces = raptor.require('raptor/stacktraces');
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
    };
};

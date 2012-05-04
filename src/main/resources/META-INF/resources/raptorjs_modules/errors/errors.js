raptorBuilder.addLoader(function(raptor) {
    var createError = function(message, cause) 
    {
        var error;

        if (arguments.length === 2)
        {
            error = message instanceof Error ? message : new Error(message);            
            error.__cause__ = cause;                        
        }
        else if (arguments.length === 1)
        {            
            if (message instanceof Error)
            {
                error = message;
            }
            else
            {
                error = new Error(message);                
            }
        }
        
        return error;
    };

    raptor.defineCore('errors', {
        
        /**
         * 
         * @param message
         * @param cause
         */
        throwError: function(message, cause)
        {
            var error = createError.apply(this, arguments);
            throw error;
        }
    });    
    
    raptor.throwError = raptor.errors.throwError;
});